import {
    transduce,
    push,
    comp,
    filter,
    map,
    multiplexObj,
    zip,
    repeat,
    take,
    choices,
    range,
} from "@thi.ng/transducers";
import { frequencies } from "@thi.ng/iterators";
import { intersection } from "@thi.ng/associative";
import { majorKey, MajorKey } from "@tonaljs/key";
import { simplify } from "@tonaljs/note";
import { toMidi } from "@tonaljs/midi";
import { Midi as parseMidi } from "@tonejs/midi";
import Meyda from "meyda";

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
                push(),
                x.scale
            )
        ),
    }),
    push(),
    majorKeys
);

export const getComparisons = (keyState) => {
    const inputMidis: Midis = transduce(
        comp(
            map((x) => (keyState[x] ? x : null)),
            filter((x) => x !== null)
        ),
        push(),
        range(12)
    );

    const commons: Midis[] = transduce(
        comp(
            map((x) =>
                intersection(new Set(x.normalizedMidis), new Set(inputMidis))
            ),
            map((x) => Array.from(x))
        ),
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
                    x[1].length / inputMidis.length +
                    (inputMidis.includes(x[0].tonicMidi) ? 0.1 : 0)
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
    // different midis notes could be normalized to same number
    return Array.from(new Set(midiNotes));
};

// https://observablehq.com/@harrislapiroff/chord-analysis
const createAudioContext = () => {
    try {
        return new AudioContext();
    } catch {
        // Safari
        return new window.webkitAudioContext();
    }
};

const decodeAudioData = async (context, arrayBuffer) => {
    try {
        return await context.decodeAudioData(arrayBuffer);
    } catch {
        // Safari
        return new Promise((reject, resolve) => {
            context.decodeAudioData(arrayBuffer, reject, resolve);
        });
    }
};

const nearestPowerOf2 = (n) => {
    return Math.pow(2, Math.round(Math.log(n) / Math.log(2)));
};

export const parseAudioFile = async (result) => {
    const SAMPLES_PER_SECOND = 1;
    const context = createAudioContext();
    const audioBuffer = await decodeAudioData(context, result);

    const audioArray = audioBuffer.getChannelData(0);

    const chunkSize = nearestPowerOf2(
        audioBuffer.sampleRate / SAMPLES_PER_SECOND
    );
    const chunkCount = Math.floor(audioArray.length / chunkSize);

    const chroma = transduce(
        map((i) =>
            Meyda.extract(
                "chroma",
                audioArray.slice(i * chunkSize, (i + 1) * chunkSize)
            )
        ),
        push(),
        range(chunkCount)
    );

    const coreNotes = transduce(
        map((x) => x.indexOf(1)),
        push(),
        chroma
    );

    // take the most 7 frequency midi notes
    return transduce(
        map((x) => x[0]),
        push(),
        transduce(
            map((x) => x),
            push(),
            frequencies(coreNotes)
        ).sort((a, b) => b[1] - a[1])
    ).slice(0, 7);
};
