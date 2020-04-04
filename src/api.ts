import { MajorKey } from "@tonaljs/key";

export type Midis = Set<number>;

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
