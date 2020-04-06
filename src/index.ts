import { start } from "@thi.ng/hdom";
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
        musicKey: map((x) => x.tonic),
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

console.log(scales);

const defaultKeyState = [...repeat(false, 12)];

const DB = new Atom<State>({
    keyState: defaultKeyState,
    highlights: new Set(),
    size: [window.innerWidth, window.innerHeight],
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

const keyGroup = (comparisons: Comparison[], width: number) => {
    const buffer = 0.1;
    const whRatio = 35;
    const bgOpts = {
        width: width,
        height: width / whRatio,
        rx: 5,
        fill: "#e2e2e2",
    };
    return () => [
        "div",
        ...comparisons.map((x, i) => [
            "div.mv2.mr2",
            {
                onmouseover: () => updateHighlights(x.normalizedMidis),
                onmouseout: () => resetHighlights(),
            },
            ["div", x.musicKey, ["small", " maj"]],
            [
                "div.dib",
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
            musicKey: map((x) => x[0].musicKey),
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
        toolbar,
        [
            "div",
            toggleGroup({
                r: (toggleWidth / 2) * (8 / 9),
                pad: (toggleWidth / 2) * (1 / 9),
            }),
            keyGroup(comparisons, bWidth),
        ],
    ];
});

const hot = (<any>module).hot;
if (hot) {
    hot.dispose(cancel);
}
