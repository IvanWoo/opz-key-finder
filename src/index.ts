import { majorKey } from "@tonaljs/key";

const keys = ["C", "D", "E", "F", "G", "A", "B"];
let scales = keys.map((v, i, a) => majorKey(v));
console.table(scales.map((x) => x.scale));
