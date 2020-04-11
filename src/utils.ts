import {
    transduce,
    push,
    conj,
    map,
    multiplexObj,
    zip,
    repeat,
    take,
    choices,
} from "@thi.ng/transducers";
import { frequencies } from "@thi.ng/iterators";
import { intersection } from "@thi.ng/associative";
import { majorKey, MajorKey } from "@tonaljs/key";
import { simplify, enharmonic } from "@tonaljs/note";
import { toMidi } from "@tonaljs/midi";
import { Midi as parseMidi } from "@tonejs/midi";

import { Scale, Midis, Comparison } from "./api";

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

export const scales: Scale[] = transduce(
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

export const getComparisons = (inputMidis: Midis) => {
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
    return comparisons;
};

export const defaultKeyState = [...repeat(false, 12)];

export const randomKeyState = [...take(12, choices([true, false], [0.5, 0.5]))];

export const parseMidiFile = (result) => {
    const parsedMidi = new parseMidi(result);
    let tracks = parsedMidi.tracks;
    tracks.sort((a, b) => b.notes.length - a.notes.length);

    // take the most 7 frequency midi notes from the longest track
    const track = tracks[0];
    const midiNotes: number[] = transduce(
        map((x) => x[0] % 12),
        push(),
        take(7, frequencies(track.notes.map((x) => x.midi)))
    );

    return midiNotes;
};
