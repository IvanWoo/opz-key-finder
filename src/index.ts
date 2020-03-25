import { start } from "@thi.ng/hdom";
import { title } from "@thi.ng/hdom-components";
import { majorKey } from "@tonaljs/key";
import { simplify, enharmonic } from "@tonaljs/note";
import { toMidi } from "@tonaljs/midi";
import {
    transduce,
    push,
    map,
    filter,
    comp,
    multiplexObj,
    range
} from "@thi.ng/transducers";
import { intersection } from "@thi.ng/associative";

import { clickToggleDot, ToggleDotOpts } from "./components";

const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

let scales = transduce(
    comp(
        map((x) => majorKey(x)),
        multiplexObj({
            raw: map((x) => x),
            tonic_midi: map((x) => toMidi(x.tonic + "2") % 12),
            music_key: map((x) => `${x.tonic} ${x.type.slice(0, 3)}`),
            normalized_midi: comp(
                map((x) => x.scale),
                map((x) =>
                    transduce(
                        map((y) => toMidi(y + "2") % 12),
                        push(),
                        x
                    )
                )
                // map((x) => x.sort((y, z) => y - z))
            )
        })
    ),
    push(),
    keys
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
    r: 16
    // pad: 2
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
            x
        ]
        // ["div.tc", i]
    ])
];

const keyGroup = (comparisons) => {
    // const max_size = comparisons[0].common_midis_size;
    return () => [
        "div",
        ...comparisons.map((x, i) => [
            "div.mv2.mr2",
            [
                "div.dib",
                [
                    "svg",
                    { width: 110, height: 10 },
                    x.common_midis_size
                        ? [
                              "rect",
                              {
                                  width: x.similarity * 100,
                                  height: 10,
                                  rx: 5,
                                  fill: "grey"
                              }
                          ]
                        : []
                ]
            ],
            x.music_key
        ])
    ];
};

const cancel = start(() => {
    let inputs_midi = transduce(
        map((x) => (state[x] ? x : null)),
        push(),
        range(12)
    );
    inputs_midi = new Set(inputs_midi);
    let comparisons = transduce(
        comp(
            multiplexObj({
                music_key: map((x) => x.music_key),
                tonic_midi: map((x) => x.tonic_midi),
                common_midis: map((x) =>
                    intersection(new Set(x.normalized_midi), inputs_midi)
                )
            }),
            multiplexObj({
                music_key: map((x) => x.music_key),
                common_midis: map((x) => x.common_midis),
                common_midis_size: map((x) => x.common_midis.size),
                similarity: map((x) =>
                    inputs_midi.has(x.tonic_midi)
                        ? x.common_midis.size / inputs_midi.size + 0.1
                        : x.common_midis.size / inputs_midi.size
                )
            })
            // filter((x) => x.common_midis_size > inputs.length / 2)
        ),
        push(),
        scales
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
