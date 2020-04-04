import { start } from "@thi.ng/hdom";
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
    repeat
} from "@thi.ng/transducers";
import { intersection } from "@thi.ng/associative";
import { majorKey, MajorKey } from "@tonaljs/key";
import { simplify, enharmonic } from "@tonaljs/note";
import { toMidi } from "@tonaljs/midi";

import { Scale, Midis, Comparison } from "./api";
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
    "B"
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
        )
    }),
    push(),
    majorKeys
);

console.log(scales);

// TODO: unify state and highlights into single obj
const state: boolean[] = [...repeat(false, 12)];

const toggleState = (i: number) => (state[i] = !state[i]);

let highlights: Midis = new Set();

const updateHighlights = (m: Midis) => {
    highlights = m;
};

const resetHighlights = () => {
    updateHighlights(new Set());
};

const wDotOpts: Partial<ToggleDotOpts> = {
    r: 16,
    pad: 2
    // margin: 2
};

const cDotOpts: Partial<ToggleDotOpts> = {
    ...wDotOpts,
    glyph: "C"
};

const bDotOpts: Partial<ToggleDotOpts> = {
    ...wDotOpts,
    bgOn: { fill: "#000" },
    bgOff: { fill: "#000" },
    floor: 2
};

const wToggle = clickToggleDot({ ...wDotOpts });
const cToggle = clickToggleDot({ ...cDotOpts });
const bToggle = clickToggleDot({ ...bDotOpts });

const toggleGroup = () => [
    "div.mb5",
    ...state.map((x, i) => [
        i === 4 ? "div.dib.mr4" : "div.dib",
        [
            i === 0
                ? cToggle
                : new Set([2, 4, 5, 7, 9, 11]).has(i)
                ? wToggle
                : bToggle,
            {
                class: "pointer mr0",
                onclick: () => toggleState(i)
            },
            x,
            highlights.has(i)
        ]
        // ["div.tc", i]
    ])
];

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
                                  fill: "grey"
                              }
                          ]
                        : []
                ]
            ],
            [
                "span",
                {
                    onmouseover: () => updateHighlights(x.normalizedMidis),
                    onmouseout: () => resetHighlights()
                },
                x.musicKey
            ]
        ])
    ];
};

const cancel = start(() => {
    let inputMidis: Midis = transduce(
        map((x) => (state[x] ? x : null)),
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
            )
        }),
        push(),
        zip(scales, commons)
    );

    comparisons = comparisons.sort((a, b) => b.similarity - a.similarity);
    return [
        "div",
        [h2, "KEY FINDER"],
        ["div", toggleGroup, keyGroup(comparisons)]
    ];
});

const hot = (<any>module).hot;
if (hot) {
    hot.dispose(cancel);
}
