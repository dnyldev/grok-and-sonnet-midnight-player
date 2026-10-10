import { AnimatePresence, motion } from "motion/react";
import { BARS, CHANGES, SONG, TOTAL_BEATS, chordAtBeat, transposeChord } from "@/data/song";
import { ChordStrip } from "@/components/ChordStrip";
import { ExtractState } from "@/components/ExtractState";
import { EASE_OUT } from "@/lib/ease";
import type { JobState } from "@/hooks/useExtraction";
import { clamp } from "@/lib/utils";

export type RibbonMode = "follow" | "map";

interface RibbonProps {
  beat: number;
  playing: boolean;
  semitones: number;
  mode: RibbonMode;
  compact: boolean;
  chords: JobState;
  onModeChange: (mode: RibbonMode) => void;
  onSeek: (beat: number) => void;
  onExtract: () => void;
  onCancelExtract: () => void;
}

export function Ribbon({
  beat,
  playing,
  semitones,
  mode,
  compact,
  chords,
  onModeChange,
  onSeek,
  onExtract,
  onCancelExtract,
}: RibbonProps) {
  const ready = chords.status === "complete";
  const safeBeat = Number.isFinite(beat) ? clamp(beat, 0, 127.999) : 0;
  const current = ready ? transposeChord(chordAtBeat(safeBeat), semitones) : "—";
  const next = ready ? CHANGES.find((c) => c.beat > safeBeat + 0.05) : undefined;
  const nextName = next ? transposeChord(next.chord, semitones) : null;

  return (
    <section className="px-4 pt-1">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-3)]">
            {ready ? (playing ? "Now" : "Chord") : "Ribbon"}
          </p>
          <p className="mt-0.5 truncate text-[22px] font-semibold leading-none tracking-[-0.03em]">{current}</p>
        </div>
        {ready ? (
          <div className="flex items-center gap-2">
            {nextName ? <span className="text-[12px] text-[var(--fg-3)]">Next {nextName}</span> : null}
            <button
              type="button"
              onClick={() => onModeChange(mode === "follow" ? "map" : "follow")}
              className="h-8 rounded-full px-3 text-[12px] text-[var(--fg-2)] transition-colors hover:bg-[var(--fill)] hover:text-[var(--fg)]"
            >
              {mode === "follow" ? "Map" : "Follow"}
            </button>
          </div>
        ) : null}
      </div>

      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: "var(--surface)",
          minHeight: compact ? 88 : 132,
          border: "0.5px solid var(--hairline)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {ready ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="px-3 py-3"
            >
              {mode === "follow" ? (
                <ChordStrip beat={beat} semitones={semitones} onSeek={onSeek} />
              ) : (
                <SongMap beat={beat} semitones={semitones} onSeek={onSeek} />
              )}
              {!compact ? (
                <p className="mt-2.5 text-center text-[11px] text-[var(--fg-3)]">
                  {SONG.timeSignature}/4 · {SONG.keyRoot} {SONG.keyMode.toLowerCase()} · tap a cell to seek
                </p>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: EASE_OUT }}
              className="px-4 py-4"
            >
              {chords.status === "idle" ? <GhostCells /> : null}
              <ExtractState
                kind="chords"
                job={chords}
                onStart={onExtract}
                onCancel={onCancelExtract}
                compact={chords.status === "running"}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function GhostCells() {
  return (
    <div className="mb-4 flex gap-[5px] overflow-hidden opacity-50" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-14 w-14 shrink-0 rounded-[10px] shimmer"
          style={{ background: "var(--fill)" }}
        />
      ))}
    </div>
  );
}

function SongMap({ beat, semitones, onSeek }: { beat: number; semitones: number; onSeek: (beat: number) => void }) {
  const currentBar = Math.min(BARS.length - 1, Math.max(0, Math.floor(beat / 4)));
  return (
    <div className="grid grid-cols-8 gap-1">
      {BARS.map((bar) => {
        const name = transposeChord(bar.changes[0][1], semitones);
        const active = bar.index === currentBar;
        const past = bar.index < currentBar;
        return (
          <button
            key={bar.index}
            type="button"
            onClick={() => onSeek(bar.index * 4)}
            aria-label={`Bar ${bar.index + 1} ${name}`}
            className="flex h-10 flex-col items-center justify-center rounded-lg text-[10px] font-medium tracking-[-0.02em] transition-colors"
            style={{
              background: active ? "var(--fg)" : past ? "var(--fill)" : "var(--surface-2)",
              color: active ? "var(--bg)" : past ? "var(--fg-3)" : "var(--fg-2)",
            }}
          >
            {name}
          </button>
        );
      })}
      <p className="col-span-8 mt-1 text-[11px] text-[var(--fg-3)]">
        {currentBar + 1} / {BARS.length} · {TOTAL_BEATS} beats
      </p>
    </div>
  );
}
