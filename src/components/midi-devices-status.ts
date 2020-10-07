import { AppContext } from "../api";
import { dropdown } from "@thi.ng/hdom-components";
import { transduce, map, push } from "@thi.ng/transducers";
import { EventBus } from "@thi.ng/interceptors";
import WebMidi from "webmidi";
import type { InputEventNoteon } from "webmidi";
import { TOGGLE_KEY_STATE, SET_MIDI_DEVICES } from "../events";

const bindAllDevices = (bus: EventBus) => {
    WebMidi.inputs.forEach((input) =>
        input.addListener("noteon", "all", (e: InputEventNoteon) => {
            bus.dispatch([TOGGLE_KEY_STATE, e.note.number % 12]);
            console.log(
                `Received 'noteon' message (${
                    e.note.name + e.note.octave
                }) from ${input.name}`
            );
        })
    );
};

export const isEnabledMidi = (bus: EventBus) => {
    WebMidi.enable((err) => {
        if (err) {
            console.log("WebMidi could not be enabled.", err);
            return;
        } else {
            console.log("WebMidi enabled!");
            bus.dispatch([SET_MIDI_DEVICES, WebMidi.inputs.map((x) => x.name)]);
        }
        bindAllDevices(bus);
    });
};

const bindDevice = (bus: EventBus, device: string) => {
    WebMidi.inputs.forEach((input) => input.removeListener());
    if (device === "All Devices") {
        bindAllDevices(bus);
        return;
    } else {
        WebMidi.getInputByName(device).addListener(
            "noteon",
            "all",
            (e: InputEventNoteon) => {
                bus.dispatch([TOGGLE_KEY_STATE, e.note.number % 12]);
                console.log(
                    `Received 'noteon' message (${
                        e.note.name + e.note.octave
                    }) from ${device}`
                );
            }
        );
    }
};

export const midiDevicesStatus = (ctx: AppContext) => {
    const views = ctx.views;
    const ui = ctx.ui;
    const bus = ctx.bus;
    return () => {
        const enabledMidi = views.enabledMidi.deref()!;
        let midiDevices = views.midiDevices.deref()!;
        return [
            "div",
            [
                "span",
                ui.midiDevicesStatus.content[Number(enabledMidi)],
                enabledMidi
                    ? "Web MIDI is available"
                    : "Web MIDI is unavailable",
            ],
            [
                "span",
                ui.midiDevicesStatus.dropdown,
                midiDevices.length >= 1
                    ? [
                          dropdown,
                          {
                              onchange: (e: Event) =>
                                  bindDevice(
                                      bus,
                                      (<HTMLSelectElement>e.target).value
                                  ),
                          },
                          transduce(
                              map((x) => [x, x]),
                              push(),
                              ["All Devices", ...midiDevices]
                          ),
                      ]
                    : [],
            ],
        ];
    };
};
