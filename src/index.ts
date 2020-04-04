import { start } from "@thi.ng/hdom";
import { Atom } from "@thi.ng/atom";
import {
    transduce,
    push,
    conj,
    map,
    filter,
    comp,
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
import { clickToggleDot, ToggleDotOpts, h2 } from "./components";

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
        musicKey: map((x) => `${x.tonic} ${x.type.slice(0, 3)}`),
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

const DB = new Atom<State>({
    keyState: [...repeat(false, 12)],
    highlights: new Set(),
    size: [window.innerWidth, window.innerHeight],
});

const toggleKeyState = (i: number) =>
    DB.resetIn(["keyState", i], !DB.deref().keyState[i]);

const updateHighlights = (m: Midis) => {
    DB.resetIn(["highlights"], m);
};

const resetHighlights = () => {
    updateHighlights(new Set());
};

window.addEventListener("resize", () => {
    DB.resetIn(["size"], [window.innerWidth, window.innerHeight]);
});

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
        "div.mb5",
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

const keyGroup = (comparisons: Comparison[]) => {
    // const maxSize = comparisons[0].common.size;
    return () => [
        "div",
        ...comparisons.map((x, i) => [
            "div.mv2.mr2",
            [
                "div.dib",
                [
                    "svg",
                    { width: 220, height: 10 },
                    x.common.size
                        ? [
                              "rect",
                              {
                                  width: x.similarity * 200,
                                  height: 10,
                                  rx: 5,
                                  fill: "grey",
                              },
                          ]
                        : [],
                ],
            ],
            [
                "span",
                {
                    onmouseover: () => updateHighlights(x.normalizedMidis),
                    onmouseout: () => resetHighlights(),
                },
                x.musicKey,
            ],
        ]),
    ];
};

const cancel = start(() => {
    const state = DB.deref();
    const keyState = state.keyState;
    const size = state.size;
    const toggleWidth = (size[0] * 0.9) / 13;

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
        [h2, "KEY FINDER"],
        [
            "div",
            toggleGroup({
                r: (toggleWidth / 2) * (8 / 9),
                pad: (toggleWidth / 2) * (1 / 9),
            }),
            keyGroup(comparisons),
        ],
    ];
});

const hot = (<any>module).hot;
if (hot) {
    hot.dispose(cancel);
}
