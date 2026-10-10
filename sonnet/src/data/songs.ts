import type { Song } from "./types";

function prog(
  bars: number,
  pattern: string[],
  startBar = 0
): { bar: number; beat: number; chord: string }[] {
  const out: { bar: number; beat: number; chord: string }[] = [];
  for (let i = 0; i < bars; i++) {
    out.push({ bar: startBar + i, beat: 0, chord: pattern[i % pattern.length] });
  }
  return out;
}

export const SONGS: Song[] = [
  {
    id: "night-drive",
    title: "Night Drive",
    artist: "Aiden Cole",
    bpm: 92,
    keyLabel: "A minor",
    rootSemitone: 9,
    bars: 16,
    mood: "Synthwave",
    coverFrom: "#1c2230",
    coverTo: "#3a2f4d",
    accent: "#d7b56d",
    chords: prog(16, ["Am", "F", "C", "G"]),
    lyrics: [
      { bar: 0, beat: 0, text: "City lights are blurring past the glass" },
      { bar: 2, beat: 0, text: "Radio hums a song we used to know" },
      { bar: 4, beat: 0, text: "Nowhere to be, just miles to let go" },
      { bar: 6, beat: 0, text: "Streetlights trace the shape of yesterday" },
      { bar: 8, beat: 0, text: "Windows down, the night air feels like home" },
      { bar: 10, beat: 0, text: "Every exit sign another maybe" },
      { bar: 12, beat: 0, text: "We don't need a map to find our way" },
      { bar: 14, beat: 0, text: "Just keep driving till the morning comes" },
    ],
  },
  {
    id: "golden-hour",
    title: "Golden Hour",
    artist: "Sable & Rome",
    bpm: 104,
    keyLabel: "C major",
    rootSemitone: 0,
    bars: 16,
    mood: "Warm pop",
    coverFrom: "#2a1f1a",
    coverTo: "#4d3420",
    accent: "#e2a565",
    chords: prog(16, ["C", "Am", "F", "G"]),
    lyrics: [
      { bar: 0, beat: 0, text: "Sun is low and the sky's on fire" },
      { bar: 2, beat: 0, text: "Everything looks a little brighter" },
      { bar: 4, beat: 0, text: "Hold my hand while the world slows down" },
      { bar: 6, beat: 0, text: "Nothing matters outside this town" },
      { bar: 8, beat: 0, text: "Golden hour, stay a little longer" },
      { bar: 10, beat: 0, text: "Every shadow's a little softer" },
      { bar: 12, beat: 0, text: "We don't need to say a single word" },
      { bar: 14, beat: 0, text: "Just this light and the sound we heard" },
    ],
  },
  {
    id: "low-tide",
    title: "Low Tide",
    artist: "Marina Vale",
    bpm: 76,
    keyLabel: "E minor",
    rootSemitone: 4,
    bars: 16,
    mood: "Downtempo",
    coverFrom: "#101c22",
    coverTo: "#1c3a3f",
    accent: "#7fb8b0",
    chords: prog(16, ["Em", "C", "G", "D"]),
    lyrics: [
      { bar: 0, beat: 0, text: "Waves pull back and leave the sand bare" },
      { bar: 2, beat: 0, text: "Quiet now, just salt and still air" },
      { bar: 4, beat: 0, text: "I've been meaning to let this go" },
      { bar: 6, beat: 0, text: "Slower now, so much slower" },
      { bar: 8, beat: 0, text: "Something in the distance calling" },
      { bar: 10, beat: 0, text: "Footprints fade before the falling" },
      { bar: 12, beat: 0, text: "Low tide always finds its way back" },
      { bar: 14, beat: 0, text: "I'll be here when the water's black" },
    ],
  },
];

export function getSong(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id);
}
