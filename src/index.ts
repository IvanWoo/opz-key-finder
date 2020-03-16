import { majorKey } from "@tonaljs/key";
import { simplify, enharmonic } from "@tonaljs/note";
import { toMidi } from "@tonaljs/midi";
import {
    transduce,
    push,
    map,
    filter,
    comp,
    multiplexObj
} from "@thi.ng/transducers";
import { intersection } from "@thi.ng/associative";

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

let inputs: Array<string> = ["C", "E", "G", "D"];
let inputs_midi: Array<number> = transduce(normalize_midi, push(), inputs);
console.log(inputs_midi);

let comparisons = transduce(
    comp(
        multiplexObj({
            music_key: map((x) => x.music_key),
            common_midis: map((x) =>
                intersection(new Set(x.normalized_midi), new Set(inputs_midi))
            )
        }),
        multiplexObj({
            music_key: map((x) => x.music_key),
            common_midis: map((x) => x.common_midis),
            common_midis_size: map((x) => x.common_midis.size)
        }),
        filter((x) => x.common_midis_size > inputs.length / 2)
    ),
    push(),
    scales
);

comparisons = comparisons.sort(
    (a, b) => b.common_midis_size - a.common_midis_size
);

console.log(comparisons);
