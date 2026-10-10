export interface ChordEvent {
  bar: number; // 0-indexed bar
  beat: number; // 0-3 within the bar (4/4)
  chord: string; // chord symbol, e.g. "Am7"
}

export interface LyricLine {
  bar: number;
  beat: number;
  text: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  keyLabel: string;
  rootSemitone: number;
  bars: number;
  chords: ChordEvent[];
  lyrics: LyricLine[];
  coverFrom: string;
  coverTo: string;
  accent: string;
  mood: string;
}
