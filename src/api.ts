import { MajorKey } from "@tonaljs/key";

export type Midis = Set<number>;

export interface Scale {
    raw?: MajorKey;
    tonic_midi: number;
    music_key: string;
    normalized_midis: Midis;
}

export interface Comparison {
    music_key: string;
    normalized_midis: Midis;
    common: Midis;
    similarity: number;
}
