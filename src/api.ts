import { MajorKey } from "@tonaljs/key";

export type Midis = Set<number>;

export interface State {
    enabledMidi: boolean;
    midiDevices: string[];
    midiFile: string;
    keyState: boolean[];
    highlights: Midis;
    size: [number, number];
    viewConfig: any;
}
export interface Scale {
    raw?: MajorKey;
    tonicMidi: number;
    majorKey: string;
    minorKey: string;
    normalizedMidis: Midis;
}

export interface Comparison {
    majorKey: string;
    minorKey: string;
    normalizedMidis: Midis;
    common: Midis;
    similarity: number;
}
