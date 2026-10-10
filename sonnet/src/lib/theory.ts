// Core music-theory helpers: note naming, chord parsing, and
// a CAGED-style generator for guitar chord-shape diagrams.

export const SHARP_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];
export const FLAT_NAMES = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
];

const NOTE_LOOKUP: Record<string, number> = {};
SHARP_NAMES.forEach((n, i) => (NOTE_LOOKUP[n] = i));
FLAT_NAMES.forEach((n, i) => (NOTE_LOOKUP[n] = i));

export function noteName(semitone: number, preferFlat = false): string {
  const n = ((semitone % 12) + 12) % 12;
  return preferFlat ? FLAT_NAMES[n] : SHARP_NAMES[n];
}

export interface ParsedChord {
  root: number; // 0-11
  quality: string; // maj, min, 7, maj7, min7, sus4, sus2, dim, 6, min6
  bass?: number; // slash chord bass note, optional
  intervals: number[];
}

const QUALITY_INTERVALS: Record<string, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  "6": [0, 4, 7, 9],
  min6: [0, 3, 7, 9],
};

/** Parse a chord symbol like "Am7", "F", "G/B", "Csus4" */
export function parseChord(symbol: string): ParsedChord {
  const [main, slash] = symbol.split("/");
  const m = main.match(/^([A-G])(#|b)?(.*)$/);
  if (!m) return { root: 0, quality: "maj", intervals: QUALITY_INTERVALS.maj };
  const letter = m[1];
  const accidental = m[2] ?? "";
  const rest = m[3] ?? "";
  const root = NOTE_LOOKUP[letter + accidental] ?? NOTE_LOOKUP[letter];

  let quality = "maj";
  if (/^maj7/.test(rest)) quality = "maj7";
  else if (/^m7|^min7/.test(rest)) quality = "min7";
  else if (/^m6|^min6/.test(rest)) quality = "min6";
  else if (/^m|^min/.test(rest)) quality = "min";
  else if (/^7/.test(rest)) quality = "7";
  else if (/^sus2/.test(rest)) quality = "sus2";
  else if (/^sus4/.test(rest)) quality = "sus4";
  else if (/^dim/.test(rest)) quality = "dim";
  else if (/^6/.test(rest)) quality = "6";

  const bass = slash ? NOTE_LOOKUP[slash] : undefined;

  return { root, quality, bass, intervals: QUALITY_INTERVALS[quality] };
}

/** Transpose a chord symbol by N semitones, preserving quality text + slash bass. */
export function transposeChordSymbol(symbol: string, semitones: number, preferFlat = false): string {
  if (!semitones) return symbol;
  const [main, slash] = symbol.split("/");
  const m = main.match(/^([A-G])(#|b)?(.*)$/);
  if (!m) return symbol;
  const letter = m[1];
  const accidental = m[2] ?? "";
  const rest = m[3] ?? "";
  const root = NOTE_LOOKUP[letter + accidental] ?? NOTE_LOOKUP[letter];
  const newRoot = noteName(root + semitones, preferFlat);
  let out = newRoot + rest;
  if (slash) {
    const b = NOTE_LOOKUP[slash];
    if (b !== undefined) out += "/" + noteName(b + semitones, preferFlat);
  }
  return out;
}

/** Return the absolute MIDI-ish note numbers (semitone from C across octaves) for a chord */
export function chordToneSemitones(chord: ParsedChord, octaveBase = 48): number[] {
  return chord.intervals.map((i) => octaveBase + chord.root + i);
}

// ---------- Guitar chord-shape diagram (CAGED-lite) ----------

export interface ChordDiagram {
  baseFret: number; // fret where the barre / lowest finger sits (0 = open position)
  frets: (number | "x")[]; // length 6, string 6(low E) -> string 1(high e), relative to baseFret (0 = at baseFret)
  shape: "E" | "A" | "Em" | "Am";
  barre: boolean;
}

const E_MAJ = [0, 2, 2, 1, 0, 0];
const E_MIN = [0, 2, 2, 0, 0, 0];
const A_MAJ: (number | "x")[] = ["x", 0, 2, 2, 2, 0];
const A_MIN: (number | "x")[] = ["x", 0, 2, 2, 1, 0];

export function getChordDiagram(root: number, quality: string): ChordDiagram {
  const minorLike = quality.startsWith("min") || quality === "dim";
  const eFret = ((root - 4) % 12 + 12) % 12; // distance from E
  const aFret = ((root - 9) % 12 + 12) % 12; // distance from A

  const useE = eFret <= aFret;
  const base = useE ? eFret : aFret;
  const shapeFrets = useE ? (minorLike ? E_MIN : E_MAJ) : (minorLike ? A_MIN : A_MAJ);

  return {
    baseFret: base,
    frets: shapeFrets,
    shape: useE ? (minorLike ? "Em" : "E") : minorLike ? "Am" : "A",
    barre: base > 0,
  };
}
