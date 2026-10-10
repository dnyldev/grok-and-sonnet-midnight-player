import { useEffect, useMemo, useRef } from "react";
import { useAnimationFrame } from "framer-motion";
import { AudioLines } from "lucide-react";
import type { Song } from "../data/types";
import type { AudioEngine } from "../audio/engine";
import { transposeChordSymbol } from "../lib/theory";
import { ExtractGate } from "./ExtractGate";
import type { ExtractionState } from "../hooks/useTransport";

const BEAT_W = 46;

interface BeatCell {
  bar: number;
  beat: number;
  chord: string;
  isChange: boolean;
}

function buildBeats(song: Song, transpose: number): BeatCell[] {
  const points = song.chords
    .map((c) => ({ absBeat: c.bar * 4 + c.beat, chord: c.chord }))
    .sort((a, b) => a.absBeat - b.absBeat);
  const total = song.bars * 4;
  const out: BeatCell[] = [];
  let lastShown = "";
  for (let b = 0; b < total; b++) {
    let sym = points[0]?.chord ?? "C";
    for (const p of points) if (p.absBeat <= b) sym = p.chord;
    const t = transposeChordSymbol(sym, transpose);
    out.push({
      bar: Math.floor(b / 4),
      beat: b % 4,
      chord: t,
      isChange: t !== lastShown,
    });
    lastShown = t;
  }
  return out;
}

export function ChordRibbon({
  song,
  engine,
  transpose,
  barBeat,
  chordState,
  onExtract,
  onSeekSeconds,
}: {
  song: Song;
  engine: AudioEngine;
  transpose: number;
  barBeat: { bar: number; beat: number };
  chordState: ExtractionState;
  onExtract: () => void;
  onSeekSeconds: (s: number) => void;
}) {
  const beats = useMemo(() => buildBeats(song, transpose), [song, transpose]);
  const secPerBeat = 60 / song.bpm;
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const totalWidth = beats.length * BEAT_W;

  useAnimationFrame(() => {
    if (!lineRef.current || chordState.status !== "ready") return;
    const beat = engine.currentBeat();
    const x = Math.max(0, Math.min(totalWidth, beat * BEAT_W));
    lineRef.current.style.transform = `translateX(${x}px)`;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el || chordState.status !== "ready") return;
    const barWidth = BEAT_W * 4;
    const target = barBeat.bar * barWidth - el.clientWidth / 2 + barWidth / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barBeat.bar, chordState.status]);

  const bars = useMemo(() => {
    const groups: BeatCell[][] = [];
    for (let i = 0; i < beats.length; i += 4) groups.push(beats.slice(i, i + 4));
    return groups;
  }, [beats]);

  if (chordState.status !== "ready") {
    return (
      <ExtractGate
        variant="ribbon"
        icon={<AudioLines size={16} />}
        title="Chord map not detected yet"
        description="Run chord detection to reveal the beat-synced chord ribbon for this track."
        actionLabel="Detect chords"
        state={chordState}
        onExtract={onExtract}
      />
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)" }}
    >
      <div
        ref={containerRef}
        className="no-scrollbar relative overflow-x-auto"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)",
        }}
      >
        <div className="relative flex px-3 py-3.5" style={{ width: totalWidth + 24 }}>
          <div
            ref={lineRef}
            className="pointer-events-none absolute top-2 bottom-2 w-[2px] rounded-full"
            style={{ background: "var(--accent)", left: 12, boxShadow: "0 0 8px var(--accent)" }}
          />
          {bars.map((group, bi) => (
            <div
              key={bi}
              className="flex shrink-0"
              style={{
                borderRight: bi < bars.length - 1 ? "1px solid var(--hairline)" : "none",
              }}
            >
              {group.map((cell) => {
                const active = cell.bar === barBeat.bar && cell.beat === barBeat.beat;
                return (
                  <button
                    key={`${cell.bar}-${cell.beat}`}
                    onClick={() => onSeekSeconds((cell.bar * 4 + cell.beat) * secPerBeat)}
                    className="focus-ring relative flex h-14 flex-col items-center justify-center transition-colors"
                    style={{ width: BEAT_W }}
                  >
                    <span
                      className="absolute top-1 h-7 w-7 rounded-lg transition-colors duration-200"
                      style={{
                        background: active ? "var(--accent-soft)" : "transparent",
                      }}
                    />
                    {cell.beat === 0 && (
                      <span
                        className="absolute -top-0.5 left-1.5 text-[9px] font-medium"
                        style={{ color: "var(--fg-3)" }}
                      >
                        {cell.bar % 2 === 0 ? "D" : "U"}
                      </span>
                    )}
                    {cell.isChange ? (
                      <span
                        className="relative text-[13px] font-semibold tracking-tight"
                        style={{ color: active ? "var(--accent)" : "var(--fg)" }}
                      >
                        {cell.chord}
                      </span>
                    ) : (
                      <span
                        className="relative h-1 w-1 rounded-full"
                        style={{ background: active ? "var(--accent)" : "var(--hairline-2)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
