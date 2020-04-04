import { start } from "@thi.ng/hdom";
import { title } from "@thi.ng/hdom-components";
import { majorKey, MajorKey } from "@tonaljs/key";
import { simplify, enharmonic } from "@tonaljs/note";
import { toMidi } from "@tonaljs/midi";
import {
    transduce,
    push,
    conj,
    map,
    filter,
    comp,
    multiplexObj,
    range,
    zip
} from "@thi.ng/transducers";
import { intersection } from "@thi.ng/associative";

import { Scale, Midis, Comparison } from "./api";
import { clickToggleDot, ToggleDotOpts } from "./components";

const keys: Array<string> = [
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

const majorKeys: Array<MajorKey> = transduce(
    map((x) => majorKey(x)),
    push(),
    keys
);

let scales: Array<Scale> = transduce(
    multiplexObj({
        raw: map((x) => x),
        tonic_midi: map((x) => toMidi(x.tonic + "2") % 12),
        music_key: map((x) => `${x.tonic} ${x.type.slice(0, 3)}`),
        normalized_midis: map((x) =>
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

const h2 = title({ element: "h2", attribs: { class: "blue" } });

const state = transduce(
    map((x) => Math.random() > 0.5),
    push(),
    range(12)
);

const toggleState = (i: number) => (state[i] = !state[i]);

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

// TODO: unify with state into single obj
let highlights = new Set();

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

const keyGroup = (comparisons: Array<Comparison>) => {
    // const max_size = comparisons[0].common.size;
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
                    onmouseover: () => (highlights = x.normalized_midis),
                    onmouseout: () => (highlights = new Set())
                },
                x.music_key
            ]
        ])
    ];
};

const cancel = start(() => {
    let input_midis: Midis = transduce(
        map((x) => (state[x] ? x : null)),
        conj(),
        range(12)
    );

    let commons: Array<Midis> = transduce(
        map((x) => intersection(x.normalized_midis, input_midis)),
        push(),
        scales
    );

    let comparisons: Array<Comparison> = transduce(
        multiplexObj({
            music_key: map((x) => x[0].music_key),
            normalized_midis: map((x) => x[0].normalized_midis),
            common: map((x) => x[1]),
            similarity: map(
                (x) =>
                    x[1].size / input_midis.size +
                    (input_midis.has(x[0].tonic_midi) ? 0.1 : 0)
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
