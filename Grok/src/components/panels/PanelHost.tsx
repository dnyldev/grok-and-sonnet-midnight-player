import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { EASE_OUT, SPRING_PRESS } from "@/lib/ease";
import type { PanelId } from "@/components/Transport";
import {
  BARS,
  CHORDS,
  LYRICS,
  TOTAL_BARS,
  UNIQUE_CHORDS,
  chordAtBeat,
  lyricIndexAtBeat,
  transposeChord,
  transposeChordDef,
} from "@/data/song";
import { ExtractState } from "@/components/ExtractState";
import type { JobState } from "@/hooks/useExtraction";
import { cn } from "@/lib/utils";

const PANEL_META: Record<PanelId, { label: string; hint: string }> = {
  chords: { label: "Chord diagrams", hint: "Guitar fingering for the current chord" },
  lyrics: { label: "Lyrics", hint: "Synced with playback" },
};

const PANEL_ORDER: PanelId[] = ["chords", "lyrics"];

interface PanelHostProps {
  panels: PanelId[];
  beat: number;
  playing: boolean;
  semitones: number;
  jobs: Record<PanelId, JobState>;
  onClose: (panel: PanelId) => void;
  onSeek: (beat: number) => void;
  onExtract: (panel: PanelId) => void;
  onCancelExtract: (panel: PanelId) => void;
}

export function PanelHost(props: PanelHostProps) {
  const { panels, onClose, jobs } = props;
  const open = PANEL_ORDER.filter((id) => panels.includes(id));
  const cap = "min(42vh, 392px)";
  const stackRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = stackRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight - el.clientHeight > 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [panels.length]);

  return (
    <div
      ref={stackRef}
      className="scroll-area min-h-0 overflow-y-auto overscroll-contain px-4"
      style={
        overflowing
          ? {
              WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 22px), transparent 100%)",
              maskImage: "linear-gradient(to bottom, black calc(100% - 22px), transparent 100%)",
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-2 pb-1">
        <AnimatePresence initial={false}>
          {open.map((panel) => (
            <motion.section
              key={panel}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.34, ease: EASE_OUT }}
              className="shrink-0 overflow-hidden"
            >
              <div
                className="flex flex-col overflow-hidden rounded-2xl border border-[var(--hairline)]"
                style={{ maxHeight: cap, background: "var(--surface)" }}
              >
                <header className="flex items-center justify-between gap-2 pl-3 pr-2" style={{ borderBottom: "0.5px solid var(--hairline)" }}>
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-[15px] font-semibold">{PANEL_META[panel].label}</span>
                    <span className="hidden truncate text-[12px] text-[var(--fg-3)] sm:inline">{PANEL_META[panel].hint}</span>
                  </div>
                  <motion.button
                    type="button"
                    aria-label={`Close ${PANEL_META[panel].label}`}
                    onClick={() => onClose(panel)}
                    whileTap={{ scale: 0.9 }}
                    transition={SPRING_PRESS}
                    className="grid size-11 shrink-0 place-items-center rounded-full text-[var(--fg-2)] transition-colors hover:bg-[var(--fill)] hover:text-[var(--fg)]"
                  >
                    <X className="size-[18px]" />
                  </motion.button>
                </header>

                <div className="min-h-0 flex-1" style={{ maxHeight: `calc(${cap} - 44px)` }}>
                  {jobs[panel].status !== "complete" ? (
                    <div className="p-4">
                      <ExtractState
                        kind={panel}
                        job={jobs[panel]}
                        onStart={() => props.onExtract(panel)}
                        onCancel={() => props.onCancelExtract(panel)}
                        compact
                      />
                    </div>
                  ) : panel === "chords" ? (
                    <FretboardPanel beat={props.beat} playing={props.playing} semitones={props.semitones} />
                  ) : (
                    <LyricsPanel beat={props.beat} onSeek={props.onSeek} />
                  )}
                </div>
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FretboardPanel({ beat, playing, semitones }: { beat: number; playing: boolean; semitones: number }) {
  const liveChord = chordAtBeat(beat);
  const [pinned, setPinned] = useState<string | null>(null);
  const shown = pinned ?? liveChord;
  const def = transposeChordDef(CHORDS[shown] ?? CHORDS.Am7, semitones);
  const nextChange = useMemo(() => {
    for (let b = Math.ceil(beat); b < TOTAL_BARS * 4; b++) {
      const c = chordAtBeat(b);
      if (c !== liveChord) return c;
    }
    return null;
  }, [beat, liveChord]);

  const frets = def.shape;
  const maxFret = Math.max(0, ...frets.filter((f) => f > 0));
  const shifted = maxFret > 5;
  const baseFret = shifted ? maxFret - 4 : 0;
  const shownFrets = frets.map((f) => (f > 0 ? f - baseFret : f));
  const width = 220;
  const height = 236;
  const padX = 22;
  const padTop = 36;
  const padBottom = 24;
  const stringGap = (width - padX * 2) / 5;
  const fretGap = (height - padTop - padBottom) / 5;

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--fg-3)]">{pinned ? "Preview" : "Playing"}</span>
          {!pinned && playing ? (
            <span className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--fill)" }}>
              <span className="size-1.5 animate-pulse rounded-full bg-current" /> Live
            </span>
          ) : null}
        </div>
        {pinned ? (
          <button type="button" onClick={() => setPinned(null)} className="text-[12px] text-[var(--fg-2)] underline decoration-dotted">
            Back to live
          </button>
        ) : (
          <span className="text-[12px] text-[var(--fg-3)]">
            Next: {nextChange ? transposeChord(nextChange, semitones) : "—"}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-4">
        <div className="shrink-0">
          <div className="mb-1 text-center text-[15px] font-semibold">{def.name}</div>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Chord diagram ${def.name}`}>
            {baseFret > 0 ? (
              <text x={4} y={padTop + fretGap * 0.7} fill="currentColor" className="fill-[var(--fg-3)]" fontSize="10" fontFamily="IBM Plex Mono, ui-monospace">
                {baseFret + 1}
              </text>
            ) : (
              <rect x={padX - 1} y={padTop - 5} width={width - padX * 2 + 2} height="4" rx="1" fill="currentColor" className="fill-[var(--fg)]" />
            )}
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={`s${i}`}
                x1={padX + i * stringGap}
                y1={padTop}
                x2={padX + i * stringGap}
                y2={height - padBottom}
                stroke="currentColor"
                className="stroke-[var(--fg-2)]"
                strokeWidth={i === 0 ? 1.6 : 1}
              />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={`f${i}`}
                x1={padX}
                y1={padTop + i * fretGap}
                x2={width - padX}
                y2={padTop + i * fretGap}
                stroke="currentColor"
                className="stroke-[var(--hairline-2)]"
                strokeWidth={1}
              />
            ))}
            {def.barre ? (
              <rect
                x={padX - 8}
                y={padTop + (def.barre[0] - baseFret - 0.78) * fretGap}
                width={stringGap * 5 + 16}
                height={10}
                rx={5}
                fill="currentColor"
                className="fill-[var(--fg)]"
                opacity={0.92}
              />
            ) : null}
            {shownFrets.map((fret, i) => {
              const x = padX + i * stringGap;
              if (fret < 0) {
                return (
                  <text key={i} x={x} y={padTop - 12} textAnchor="middle" fontSize="11" fill="currentColor" className="fill-[var(--fg-3)]">
                    ×
                  </text>
                );
              }
              if (fret === 0) {
                return (
                  <circle key={i} cx={x} cy={padTop - 14} r={4.5} fill="none" stroke="currentColor" className="stroke-[var(--fg)]" strokeWidth={1.2} />
                );
              }
              const y = padTop + (fret - 0.5) * fretGap;
              const finger = def.fingers[i] > 0 ? def.fingers[i] : null;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={9} fill="currentColor" className="fill-[var(--fg)]" />
                  {finger ? (
                    <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor" className="fill-[var(--bg)]">
                      {finger}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="no-scrollbar hidden max-h-[220px] flex-1 overflow-y-auto sm:block">
          <p className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-[var(--fg-3)]">Voicings</p>
          <div className="flex flex-col gap-1">
            {UNIQUE_CHORDS.map((name) => {
              const label = transposeChord(name, semitones);
              const active = name === shown;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setPinned(name === liveChord ? null : name)}
                  className={cn(
                    "rounded-xl px-2.5 py-1.5 text-left text-[13px] transition-colors",
                    active ? "bg-[var(--fg)] text-[var(--bg)]" : "text-[var(--fg-2)] hover:bg-[var(--fill)]",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LyricsPanel({ beat, onSeek }: { beat: number; onSeek: (beat: number) => void }) {
  const active = lyricIndexAtBeat(beat);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-line="${active}"]`);
    if (el instanceof HTMLElement) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [active]);

  return (
    <div ref={listRef} className="scroll-area h-full overflow-y-auto px-5 py-4">
      {BARS[0] ? (
        <p className="mb-3 text-[11px] uppercase tracking-[0.08em] text-[var(--fg-3)]">Afterglow Sessions</p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        {LYRICS.map((line, i) => {
          const on = i === active;
          const past = i < active;
          return (
            <button
              key={line.beat}
              type="button"
              data-line={i}
              onClick={() => onSeek(line.beat)}
              className={cn(
                "rounded-xl px-2 py-1.5 text-left text-[16px] leading-snug tracking-[-0.015em] transition-colors",
                on && "bg-[var(--fill)] font-medium text-[var(--fg)]",
                past && !on && "text-[var(--fg-3)]",
                !past && !on && "text-[var(--fg-2)] hover:text-[var(--fg)]",
              )}
            >
              {line.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
