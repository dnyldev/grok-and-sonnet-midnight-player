export type JobKind = "chords" | "lyrics" | "stems";

export interface PipelineStage {
  id: string;
  label: string;
  detail: string;
  ms: number;
}

export const PIPELINES: Record<JobKind, PipelineStage[]> = {
  chords: [
    { id: "decode", label: "Decoding source", detail: "48 kHz stereo · 3:07 · PCM float32", ms: 920 },
    { id: "tempo", label: "Estimating tempo", detail: "Onset envelope · 128 beats · 92 BPM", ms: 1280 },
    { id: "chroma", label: "Computing chroma", detail: "CQT 6 octaves · key = A minor (0.91)", ms: 1480 },
    { id: "hmm", label: "Inferring sequence", detail: "32 bars segmented · 12 unique voicings", ms: 1640 },
    { id: "voicing", label: "Mapping voicings", detail: "Guitar shapes · barre detection", ms: 1100 },
    { id: "align", label: "Aligning to grid", detail: "4/4 locked · downbeat confidence 0.97", ms: 780 },
  ],
  lyrics: [
    { id: "isolate", label: "Isolating vocal", detail: "Source separation · vocal mask 0.86", ms: 1120 },
    { id: "asr", label: "Transcribing phrases", detail: "12 lines · English · studio mix", ms: 1760 },
    { id: "align", label: "Forced alignment", detail: "Beat-locked timestamps · ±18 ms", ms: 1320 },
    { id: "format", label: "Formatting lines", detail: "LRC-ready · 12 phrases", ms: 760 },
  ],
  stems: [
    { id: "prep", label: "Preparing source", detail: "Resample · loudness scan −14 LUFS", ms: 880 },
    { id: "vocals", label: "Separating vocals", detail: "Mask refine · residual < −28 dB", ms: 1680 },
    { id: "drums", label: "Isolating drums", detail: "Transient preserve · kick / snare / hat", ms: 1520 },
    { id: "bass", label: "Isolating bass", detail: "Sub 40–180 Hz · harmonic lock", ms: 1340 },
    { id: "other", label: "Residual mix", detail: "Pad · guitar · atmosphere", ms: 1080 },
    { id: "norm", label: "Normalizing buses", detail: "True-peak −1 dBTP · 4 stems ready", ms: 720 },
  ],
};

export const JOB_META: Record<
  JobKind,
  { title: string; action: string; running: string; done: string; hint: string; jobPrefix: string }
> = {
  chords: {
    title: "Chord analysis",
    action: "Extract chords",
    running: "Extracting chords",
    done: "Chords extracted",
    hint: "Harmonic structure, voicings, and the chord ribbon are produced from the mix.",
    jobPrefix: "chr",
  },
  lyrics: {
    title: "Lyric transcription",
    action: "Transcribe lyrics",
    running: "Transcribing lyrics",
    done: "Lyrics transcribed",
    hint: "Vocal phrases are transcribed and aligned to the beat grid.",
    jobPrefix: "lyr",
  },
  stems: {
    title: "Stem separation",
    action: "Separate stems",
    running: "Separating stems",
    done: "Stems separated",
    hint: "Vocals, drums, bass, and the residual mix become independent buses.",
    jobPrefix: "stm",
  },
};

export function jobIdFor(kind: JobKind) {
  const seed = { chords: "8f2a91c4", lyrics: "3c71e0b2", stems: "a19d44ef" }[kind];
  return `${JOB_META[kind].jobPrefix}_${seed}`;
}

export function pipelineDuration(kind: JobKind) {
  return PIPELINES[kind].reduce((sum, stage) => sum + stage.ms, 0);
}
