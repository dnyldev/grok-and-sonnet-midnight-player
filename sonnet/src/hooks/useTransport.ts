import { useCallback, useEffect, useRef, useState } from "react";
import { AudioEngine, DEFAULT_STEM_VOLUME, type StemKey } from "../audio/engine";
import type { Song } from "../data/types";

export type ExtractStatus = "idle" | "processing" | "ready";

export interface ExtractionState {
  status: ExtractStatus;
  progress: number; // 0-100
  label: string;
}

const IDLE: ExtractionState = { status: "idle", progress: 0, label: "" };

function runExtraction(
  steps: { at: number; label: string }[],
  totalMs: number,
  onUpdate: (s: ExtractionState) => void,
  onDone: () => void
) {
  const start = performance.now();
  let raf = 0;
  const tick = () => {
    const elapsed = performance.now() - start;
    const progress = Math.min(100, (elapsed / totalMs) * 100);
    let label = steps[0].label;
    for (const s of steps) if (progress >= s.at) label = s.label;
    onUpdate({ status: "processing", progress, label });
    if (progress < 100) {
      raf = requestAnimationFrame(tick);
    } else {
      onDone();
    }
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function useTransport() {
  const engineRef = useRef<AudioEngine | null>(null);
  if (!engineRef.current) engineRef.current = new AudioEngine();
  const engine = engineRef.current;

  const [song, setSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [duration, setDuration] = useState(0);
  const [barBeat, setBarBeat] = useState({ bar: 0, beat: 0 });
  const [bpm, setBpmState] = useState(0);
  const [transpose, setTransposeState] = useState(0);
  const [stemVolumes, setStemVolumes] = useState<Record<StemKey, number>>({
    ...DEFAULT_STEM_VOLUME,
  });
  const [spectrum, setSpectrum] = useState<number[]>(new Array(24).fill(0));

  const [chordState, setChordState] = useState<ExtractionState>(IDLE);
  const [lyricsState, setLyricsState] = useState<ExtractionState>(IDLE);
  const [stemsState, setStemsState] = useState<ExtractionState>(IDLE);

  const cancelersRef = useRef<Record<string, () => void>>({});

  // Throttled polling loop for React-rendered values (numbers, labels).
  // High-frequency visuals (playhead line, spectrum bars) read the engine
  // directly inside their own rAF loops to stay silky without re-rendering
  // the whole tree on every frame.
  useEffect(() => {
    const id = window.setInterval(() => {
      setPlayhead(engine.currentSeconds());
      setDuration(engine.durationSeconds());
      setBarBeat(engine.getBarBeat());
      setSpectrum(engine.getSpectrum());
    }, 90);
    return () => window.clearInterval(id);
  }, [engine]);

  const loadSong = useCallback(
    (s: Song) => {
      engine.pause();
      engine.loadSong(s);
      setSong(s);
      setIsPlaying(false);
      setPlayhead(0);
      setDuration(s.bars * 4 * (60 / s.bpm));
      setBarBeat({ bar: 0, beat: 0 });
      setBpmState(s.bpm);
      setTransposeState(0);
      setStemVolumes({ ...DEFAULT_STEM_VOLUME });
      setChordState(IDLE);
      setLyricsState(IDLE);
      setStemsState(IDLE);
      Object.values(cancelersRef.current).forEach((c) => c());
      cancelersRef.current = {};
    },
    [engine]
  );

  const play = useCallback(() => {
    if (!song) return;
    engine.play();
    setIsPlaying(true);
  }, [engine, song]);

  const pause = useCallback(() => {
    engine.pause();
    setIsPlaying(false);
  }, [engine]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  useEffect(() => {
    engine.onEnded = () => {
      setIsPlaying(false);
      setPlayhead(engine.currentSeconds());
    };
  }, [engine]);

  const seekBy = useCallback(
    (delta: number) => {
      engine.seekSeconds(engine.currentSeconds() + delta);
      setPlayhead(engine.currentSeconds());
    },
    [engine]
  );

  const seekTo = useCallback(
    (seconds: number) => {
      engine.seekSeconds(seconds);
      setPlayhead(engine.currentSeconds());
    },
    [engine]
  );

  const setBpm = useCallback(
    (v: number) => {
      engine.setBpm(v);
      setBpmState(v);
    },
    [engine]
  );

  const setTranspose = useCallback(
    (v: number) => {
      engine.setTranspose(v);
      setTransposeState(v);
    },
    [engine]
  );

  const setStemVolume = useCallback(
    (key: StemKey, v: number) => {
      engine.setStemVolume(key, v);
      setStemVolumes((prev) => ({ ...prev, [key]: v }));
    },
    [engine]
  );

  const extractChords = useCallback(() => {
    if (chordState.status !== "idle") return;
    setChordState({ status: "processing", progress: 0, label: "Listening to the mix…" });
    const cancel = runExtraction(
      [
        { at: 0, label: "Listening to the mix…" },
        { at: 30, label: "Isolating harmonic content…" },
        { at: 65, label: "Matching chord templates…" },
        { at: 90, label: "Building the chord map…" },
      ],
      2400,
      setChordState,
      () => setChordState({ status: "ready", progress: 100, label: "Chords ready" })
    );
    cancelersRef.current.chords = cancel;
  }, [chordState.status]);

  const extractLyrics = useCallback(() => {
    if (lyricsState.status !== "idle") return;
    setLyricsState({ status: "processing", progress: 0, label: "Scanning vocal track…" });
    const cancel = runExtraction(
      [
        { at: 0, label: "Scanning vocal track…" },
        { at: 35, label: "Transcribing phrases…" },
        { at: 70, label: "Aligning to the beat grid…" },
      ],
      2100,
      setLyricsState,
      () => setLyricsState({ status: "ready", progress: 100, label: "Lyrics ready" })
    );
    cancelersRef.current.lyrics = cancel;
  }, [lyricsState.status]);

  const extractStems = useCallback(() => {
    if (stemsState.status !== "idle") return;
    setStemsState({ status: "processing", progress: 0, label: "Analyzing frequency bands…" });
    const cancel = runExtraction(
      [
        { at: 0, label: "Analyzing frequency bands…" },
        { at: 25, label: "Separating drums…" },
        { at: 50, label: "Separating bass…" },
        { at: 72, label: "Separating pad & piano…" },
        { at: 92, label: "Rendering mixer…" },
      ],
      3000,
      setStemsState,
      () => setStemsState({ status: "ready", progress: 100, label: "Stems ready" })
    );
    cancelersRef.current.stems = cancel;
  }, [stemsState.status]);

  return {
    engine,
    song,
    loadSong,
    isPlaying,
    play,
    pause,
    toggle,
    playhead,
    duration,
    barBeat,
    bpm,
    setBpm,
    transpose,
    setTranspose,
    stemVolumes,
    setStemVolume,
    seekBy,
    seekTo,
    spectrum,
    chordState,
    lyricsState,
    stemsState,
    extractChords,
    extractLyrics,
    extractStems,
  };
}

export type TransportApi = ReturnType<typeof useTransport>;
