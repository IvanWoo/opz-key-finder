import { start } from "@thi.ng/hdom";
import {
    dropdown,
    slideToggleRect,
    ToggleRectOpts,
} from "@thi.ng/hdom-components";
import { Atom } from "@thi.ng/atom";
import { transduce, push, map } from "@thi.ng/transducers";
import WebMidi, { InputEventNoteon } from "webmidi";

import type { State, Midis, Comparison } from "./api";
import { clickToggleDot, ToggleDotOpts, h2, button } from "./components";
import {
    defaultKeyState,
    randomKeyState,
    getComparisons,
    parseMidiFile,
    getInputMidis,
} from "./utils";

const DB = new Atom<State>({
    enabledMidi: false,
    midiDevices: [],
    midiFile: "DROP MIDI FILE HERE...",
    keyState: defaultKeyState,
    highlights: new Set(),
    size: [window.innerWidth, window.innerHeight],
    viewConfig: { showMinor: true, showSmall: true },
});

const toggleKeyState = (i: number) => {
    DB.resetIn(["keyState", i], !DB.deref().keyState[i]);
};

const resetKeyState = () => {
    DB.resetIn(["keyState"], defaultKeyState);
};

const setRandomKeyState = () => {
    DB.resetIn(["keyState"], randomKeyState);
};

const updateHighlights = (m: Midis) => {
    DB.resetIn(["highlights"], m);
};

const resetHighlights = () => {
    updateHighlights(new Set());
};

window.addEventListener("resize", () => {
    DB.resetIn(["size"], [window.innerWidth, window.innerHeight]);
});

const btOpts = {
    class: "mr3 pv2 ph2 bg-black white f4",
};

const toolbar = () => {
    const btClear = button(() => resetKeyState(), "Clear", btOpts);
    const btRandom = button(() => setRandomKeyState(), "Random", btOpts);
    return () => ["div.mv4", [btClear], [btRandom]];
};

const wDotOpts: Partial<ToggleDotOpts> = {
    anim: 0,
    r: 16,
    pad: 2,
    // margin: 2
};

const cDotOpts: Partial<ToggleDotOpts> = {
    ...wDotOpts,
    glyph: "C",
};

const bDotOpts: Partial<ToggleDotOpts> = {
    ...wDotOpts,
    bgOn: { fill: "#000" },
    bgOff: { fill: "#000" },
    floor: 2,
};

const toggleGroup = (opts) => {
    const state = DB.deref();
    return () => [
        "div.mb4",
        ...state.keyState.map((x, i) => [
            i === 4 ? "div.dib.mr4" : "div.dib",
            [
                i === 0
                    ? clickToggleDot({ ...cDotOpts, ...opts })
                    : new Set([2, 4, 5, 7, 9, 11]).has(i)
                    ? clickToggleDot({ ...wDotOpts, ...opts })
                    : clickToggleDot({ ...bDotOpts, ...opts }),
                {
                    class: "pointer mr0",
                    onclick: () => toggleKeyState(i),
                },
                x,
                state.highlights.has(i),
            ],
            // ["div.tc", i]
        ]),
    ];
};

const rectOpts: Partial<ToggleRectOpts> = {
    w: 16,
    h: 8,
    pad: 2,
    margin: 0,
};

const toggleSq = slideToggleRect({ ...rectOpts, vertical: false });

const toggleViewConfig = (target: string) => {
    DB.resetIn(["viewConfig", target], !DB.deref().viewConfig[target]);
};

const viewConfigToggleGroup = (_: any, toggle: any) => {
    const state = DB.deref();
    const config = state.viewConfig;
    return [
        "div",
        Object.entries(config).map(([k, v]) => [
            "div.mv2",
            [
                toggle,
                {
                    class: "pointer mr2",
                    onclick: () => toggleViewConfig(k),
                },
                v,
            ],
            k,
        ]),
    ];
};

const keyGroup = (comparisons: Comparison[], width: number) => {
    const state = DB.deref();
    const viewConfig = state.viewConfig;
    const buffer = 0.1;
    const whRatio = 35;
    const bgOpts = {
        width: width,
        height: width / whRatio,
        rx: 5,
        fill: "#e2e2e2",
    };
    return () => [
        "div.dib",
        ...comparisons.map((x, i) => [
            "div.mv2.mr2",
            {
                onmouseover: () => updateHighlights(x.normalizedMidis),
                onmouseout: () => resetHighlights(),
            },
            [
                "div.flex",
                [
                    "div",
                    x.majorKey,
                    viewConfig.showSmall ? ["small", " maj"] : [],
                ],
                viewConfig.showMinor
                    ? [
                          "div",
                          ["span.red", " ・ "],
                          x.minorKey,
                          viewConfig.showSmall ? ["small", " min"] : [],
                      ]
                    : [],
            ],
            [
                "div",
                [
                    "svg",
                    { width: width * (1 + buffer), height: width / whRatio },
                    [
                        "g",
                        ["rect", bgOpts],
                        x.common.size
                            ? [
                                  "rect",
                                  {
                                      ...bgOpts,
                                      width: x.similarity * width,
                                      fill: "#000",
                                  },
                              ]
                            : [],
                    ],
                ],
            ],
        ]),
    ];
};

const bindAllDevices = () => {
    WebMidi.inputs.forEach((input) =>
        input.addListener("noteon", "all", (e: InputEventNoteon) => {
            toggleKeyState(e.note.number % 12);
            console.log(
                `Received 'noteon' message (${
                    e.note.name + e.note.octave
                }) from ${input.name}`
            );
        })
    );
};

const isEnabledMidi = () => {
    WebMidi.enable((err) => {
        if (err) {
            console.log("WebMidi could not be enabled.", err);
            return;
        } else {
            console.log("WebMidi enabled!");
            DB.resetIn(["enabledMidi"], true);
            DB.resetIn(
                ["midiDevices"],
                WebMidi.inputs.map((x) => x.name)
            );
        }
        bindAllDevices();
    });
};

const bindDevice = (device: string) => {
    if (device === "All Devices") {
        bindAllDevices();
        return;
    } else {
        WebMidi.inputs.forEach((input) => input.removeListener());
        WebMidi.getInputByName(device).addListener(
            "noteon",
            "all",
            (e: InputEventNoteon) => {
                toggleKeyState(e.note.number % 12);
                console.log(
                    `Received 'noteon' message (${
                        e.note.name + e.note.octave
                    }) from ${device}`
                );
            }
        );
    }
};

isEnabledMidi();

const midiDevicesStatus = (ctx: State) => {
    const enabledMidi = ctx.enabledMidi;
    let midiDevices = ctx.midiDevices;
    if (midiDevices.length > 0) {
        midiDevices.unshift("All Devices");
    }
    return () => [
        "div",
        enabledMidi
            ? ["span.mid-gray.bg-washed-green.pa1", "Web MIDI is available"]
            : ["span.mid-gray.bg-washed-red.pa1", "Web MIDI is unavailable"],
        [
            "span.ml2",
            midiDevices.length > 1
                ? [
                      dropdown,
                      {
                          onchange: (e: Event) =>
                              bindDevice((<HTMLSelectElement>e.target).value),
                      },
                      transduce(
                          map((x) => [x, x]),
                          push(),
                          new Set(midiDevices)
                      ),
                  ]
                : [],
        ],
    ];
};

const stopE = (e) => {
    e.preventDefault();
    e.stopPropagation();
};

const onDrop = (e) => {
    stopE(e);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        const reader = new FileReader();
        const file = files[0];
        reader.onload = (e) => {
            if (file.type === "audio/midi") {
                DB.resetIn(["midiFile"], file.name);
                const midiNotes = parseMidiFile(e.target.result);
                // console.log(midiNotes);
                resetKeyState();
                midiNotes.forEach((x) => toggleKeyState(x));
            } else {
                DB.resetIn(["midiFile"], "INVALID MIDI FILE...");
                setTimeout(
                    () => DB.resetIn(["midiFile"], "DROP MIDI FILE HERE..."),
                    0.5 * 1000
                );
            }
        };
        reader.readAsArrayBuffer(file);
    }
};

const midiFileDropZone = (ctx: State) => {
    const midiFile = ctx.midiFile;
    const size = ctx.size;
    const bWidth = Math.min(400, size[0] * 0.9);
    return () => [
        "div.mt2.mb4.ba.b--dotted.bw1.dib.pa4.v-mid.tc",
        {
            ondrop: (e) => {
                e.target.classList.remove("dragover");
                onDrop(e);
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

const cancel = start(() => {
    const state = DB.deref();

    const keyState = state.keyState;
    const size = state.size;
    const toggleWidth = Math.min(18 * 2, (size[0] * 0.9) / 13);
    const bWidth = Math.min(400, size[0] * 0.9);

    const inputMidis = getInputMidis(keyState);
    const comparisons: Comparison[] = getComparisons(inputMidis);
    return [
        "div",
        [h2, "OP-Z KEY FINDER"],
        midiDevicesStatus(state),
        toolbar,
        [
            "div.mb2",
            toggleGroup({
                r: (toggleWidth / 2) * (8 / 9),
                pad: (toggleWidth / 2) * (1 / 9),
            }),
            keyGroup(comparisons, bWidth),
        ],
        midiFileDropZone(state),
        [
            "div.db",
            [
                "details",
                ["summary", "View Config"],
                [viewConfigToggleGroup, toggleSq],
            ],
        ],
    ];
});

const hot = (<any>module).hot;
if (hot) {
    hot.dispose(cancel);
}
