import { AppContext } from "../api";
import { parseMidiFile, defaultKeyState } from "../utils";
import { EventBus } from "@thi.ng/interceptors";
import { SET_MIDI_FILE, SET_MIDI_FILE_ERROR, SET_KEY_STATE } from "../events";

const stopE = (e) => {
    e.preventDefault();
    // e.stopPropagation();
};

const onDrop = (bus: EventBus, e) => {
    stopE(e);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        const reader = new FileReader();
        const file = files[0];
        reader.onload = (e) => {
            if (file.type === "audio/midi") {
                bus.dispatch([SET_MIDI_FILE, file.name]);
                const midiNotes = parseMidiFile(e.target.result);
                bus.dispatch([
                    SET_KEY_STATE,
                    defaultKeyState.map((v, k) =>
                        midiNotes.includes(k) ? true : false
                    ),
                ]);
            } else {
                bus.dispatch([SET_MIDI_FILE_ERROR]);
            }
        };
        reader.readAsArrayBuffer(file);
    }
};

export const midiFileDropZone = (ctx: AppContext) => {
    const bus = ctx.bus;
    const views = ctx.views;
    const midiFile = views.midiFile.deref()!;
    const size = views.size.deref()!;
    const bWidth = Math.min(400 * 1.1, size[0] * 0.9);
    return [
        "div.mt2.mb4.ba.b--dotted.bw1.dib.pa4.v-mid.tc",
        {
            ondrop: (e) => {
                e.target.classList.remove("dragover");
                onDrop(bus, e);
            },
            ondragenter: (e) => {
                e.target.classList.add("dragover");
                stopE(e);
            },
            ondragleave: (e) => {
                e.target.classList.remove("dragover");
                stopE(e);
            },
            ondragover: (e) => stopE(e),
            style: {
                width: `${bWidth}px`,
            },
        },
        midiFile,
    ];
};
