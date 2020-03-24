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

const normalize_midi = map((y) => toMidi(y + "2") % 12);

let scales = transduce(
    comp(
        map((x) => majorKey(x)),
        multiplexObj({
            raw: map((x) => x),
            music_key: map((x) => `${x.tonic} ${x.type}`),
            normalized_midi: comp(
                map((x) => x.scale),
                map((x) => transduce(normalize_midi, push(), x))
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

const dotOpts: Partial<ToggleDotOpts> = {
    r: 16,
    pad: 2,
    margin: 2
    // glyph: "C"
};

const toggleZ = clickToggleDot({ ...dotOpts });

const toggleGroup = (_: any, toggle: any) => [
    "div.mb3",
    ...state.map((x, i) => [
        "div.dib",
        [
            toggle,
            {
                class: "pointer mr1",
                onclick: () => toggleState(i)
            },
            x
        ],
        ["div.tc", i]
    ])
];

const keyGroup = (comparisons) => {
    const max_size = comparisons[0].common_midis_size;
    return () => [
        "div",
        ...comparisons.map((x, i) => [
            "div",
            [
                "div.dib",
                [
                    "svg",
                    { width: "100", height: "1" },
                    x.common_midis_size
                        ? [
                              "line",
                              {
                                  x1: 0,
                                  y1: 0.5,
                                  x2: (x.common_midis_size / max_size) * 100,
                                  y2: 0.5,
                                  stroke: "black"
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
    let comparisons = transduce(
        comp(
            multiplexObj({
                music_key: map((x) => x.music_key),
                common_midis: map((x) =>
                    intersection(
                        new Set(x.normalized_midi),
                        new Set(inputs_midi)
                    )
                )
            }),
            multiplexObj({
                music_key: map((x) => x.music_key),
                common_midis: map((x) => x.common_midis),
                common_midis_size: map((x) => x.common_midis.size)
            })
            // filter((x) => x.common_midis_size > inputs.length / 2)
        ),
        push(),
        scales
    );
    comparisons = comparisons.sort(
        (a, b) => b.common_midis_size - a.common_midis_size
    );
    return [
        "div",
        [h2, "Let's get it"],
        ["div", [toggleGroup, toggleZ], keyGroup(comparisons)]
    ];
});

const hot = (<any>module).hot;
if (hot) {
    hot.dispose(cancel);
}
