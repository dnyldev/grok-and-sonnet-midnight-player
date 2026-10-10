import { useCallback, useEffect, useRef, useState } from "react";
import { engine, type EngineLevels } from "@/audio/engine";
import { SONG, STEMS, TOTAL_BEATS, type StemId } from "@/data/song";

export interface MixState {
  level: number;
  muted: boolean;
}

const initialMix = Object.fromEntries(
  STEMS.map((s) => [s.id, { level: s.defaultLevel / 100, muted: false }]),
) as Record<StemId, MixState>;

const silentLevels: EngineLevels = { vocals: 0, drums: 0, bass: 0, other: 0 };

export function useTransport() {
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [bpm, setBpmState] = useState(SONG.bpm);
  const [semitones, setSemitonesState] = useState(0);
  const [mix, setMix] = useState<Record<StemId, MixState>>(initialMix);
  const [levels, setLevels] = useState<EngineLevels>(silentLevels);
  const frame = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    engine.onEnd = () => {
      setPlaying(false);
      setBeat(0);
    };
    return () => {
      engine.onEnd = undefined;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const loop = (t: number) => {
      if (!alive) return;
      if (t - last.current > 32) {
        last.current = t;
        setBeat(engine.position());
        setLevels(engine.playing ? engine.levels() : silentLevels);
      }
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const toggle = useCallback(async () => {
    if (engine.playing) {
      engine.pause();
      setPlaying(false);
    } else {
      await engine.play();
      setPlaying(true);
    }
  }, []);

  const seekBeat = useCallback((target: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_BEATS - 0.05, target));
    engine.seek(clamped);
    setBeat(clamped);
    if (!engine.playing) setPlaying(false);
  }, []);

  const skip = useCallback(
    (seconds: number) => {
      const beats = seconds / engine.secPerBeat;
      seekBeat(engine.position() + beats);
    },
    [seekBeat],
  );

  const setBpm = useCallback((value: number) => {
    engine.setBpm(value);
    setBpmState(engine.bpm);
  }, []);

  const setSemitones = useCallback((value: number) => {
    engine.setSemitones(value);
    setSemitonesState(engine.semitones);
  }, []);

  const setStemLevel = useCallback((id: StemId, level: number) => {
    void engine.ensure();
    engine.setStem(id, level);
    setMix((prev) => ({ ...prev, [id]: { ...prev[id], level } }));
  }, []);

  const toggleMute = useCallback((id: StemId) => {
    void engine.ensure();
    setMix((prev) => {
      const next = { ...prev, [id]: { ...prev[id], muted: !prev[id].muted } };
      engine.setStem(id, undefined, next[id].muted);
      return next;
    });
  }, []);

  const resetMix = useCallback(() => {
    void engine.ensure();
    setMix(initialMix);
    for (const stem of STEMS) {
      engine.setStem(stem.id, stem.defaultLevel / 100, false);
    }
  }, []);

  return {
    playing,
    beat,
    bpm,
    semitones,
    mix,
    levels,
    toggle,
    seekBeat,
    skip,
    setBpm,
    setSemitones,
    setStemLevel,
    toggleMute,
    resetMix,
    duration: engine.duration,
    secPerBeat: engine.secPerBeat,
  };
}
