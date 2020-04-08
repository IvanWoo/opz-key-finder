import { MajorKey } from "@tonaljs/key";

export type Midis = Set<number>;

export interface State {
    enabledMidi: boolean;
    midiDevices: string[];
    keyState: boolean[];
    highlights: Midis;
    size: [number, number];
}
export interface Scale {
    raw?: MajorKey;
    tonicMidi: number;
    musicKey: string;
    normalizedMidis: Midis;
}

export interface Comparison {
    musicKey: string;
    normalizedMidis: Midis;
    common: Midis;
    similarity: number;
}
