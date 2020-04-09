import { start } from "@thi.ng/hdom";
import {
    dropdown,
    slideToggleRect,
    ToggleRectOpts,
} from "@thi.ng/hdom-components";
import { Atom } from "@thi.ng/atom";
import {
    transduce,
    push,
    conj,
    map,
    take,
    choices,
    multiplexObj,
    range,
    zip,
    repeat,
} from "@thi.ng/transducers";
import { intersection } from "@thi.ng/associative";
import { majorKey, MajorKey } from "@tonaljs/key";
import { simplify, enharmonic } from "@tonaljs/note";
import { toMidi } from "@tonaljs/midi";
import WebMidi, { InputEventNoteon } from "webmidi";
import { Midi as parseMidi } from "@tonejs/midi";

import { State, Scale, Midis, Comparison } from "./api";
import { clickToggleDot, ToggleDotOpts, h2, button } from "./components";

const keys: string[] = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
];

const majorKeys: MajorKey[] = transduce(
    map((x) => majorKey(x)),
    push(),
    keys
);

let scales: Scale[] = transduce(
    multiplexObj({
        raw: map((x) => x),
        tonicMidi: map((x) => toMidi(x.tonic + "2") % 12),
        majorKey: map((x) => x.tonic),
        minorKey: map((x) => simplify(x.minorRelative).toLowerCase()),
        normalizedMidis: map((x) =>
            transduce(
                map((y) => toMidi(y + "2") % 12),
                conj(),
                x.scale
            )
        ),
    }),
    push(),
    majorKeys
);

// console.log(scales);

const defaultKeyState = [...repeat(false, 12)];

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

const randomKeyState = () => {
    DB.resetIn(["keyState"], [...take(12, choices([true, false], [0.5, 0.5]))]);
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
    const btRandom = button(() => randomKeyState(), "Random", btOpts);
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
            console.log(file);
            if (file.type === "audio/midi") {
                DB.resetIn(["midiFile"], file.name);
                const parsedMidi = new parseMidi(e.target.event);
                console.log(parsedMidi);
            } else {
                DB.resetIn(["midiFile"], "INVALID MIDI FILE...");
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

    let inputMidis: Midis = transduce(
        map((x) => (keyState[x] ? x : null)),
        conj(),
        range(12)
    );

    let commons: Midis[] = transduce(
        map((x) => intersection(x.normalizedMidis, inputMidis)),
        push(),
        scales
    );

    let comparisons: Comparison[] = transduce(
        multiplexObj({
            majorKey: map((x) => x[0].majorKey),
            minorKey: map((x) => x[0].minorKey),
            normalizedMidis: map((x) => x[0].normalizedMidis),
            common: map((x) => x[1]),
            similarity: map(
                (x) =>
                    x[1].size / inputMidis.size +
                    (inputMidis.has(x[0].tonicMidi) ? 0.1 : 0)
            ),
        }),
        push(),
        zip(scales, commons)
    );

    comparisons = comparisons.sort((a, b) => b.similarity - a.similarity);
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
