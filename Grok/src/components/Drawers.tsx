import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { Mic, Drum, Guitar, AudioLines } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Slider } from "@/components/ui/Slider";
import { ExtractState } from "@/components/ExtractState";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { SPRING_PRESS } from "@/lib/ease";
import { NOTE_NAMES, SONG, STEMS, transposeChord, type StemId } from "@/data/song";
import type { MixState } from "@/hooks/useTransport";
import type { JobState } from "@/hooks/useExtraction";
import { cn } from "@/lib/utils";

const PRESETS = [80, 92, 100, 110, 120, 140];

export function TempoSheet({
  open,
  onOpenChange,
  bpm,
  onBpm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bpm: number;
  onBpm: (bpm: number) => void;
}) {
  const original = bpm === SONG.bpm;
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Tempo" description="Live — changes apply immediately">
      <div className="px-5 pb-6 pt-2">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <NumberTicker value={bpm} className="text-[56px] font-semibold leading-none tracking-[-0.04em] tabular-nums" />
              <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[var(--fg-3)]">BPM</span>
            </div>
            <p className="mt-2 text-[13px] text-[var(--fg-3)]">
              {original ? "Original tempo" : `${bpm > SONG.bpm ? "+" : ""}${bpm - SONG.bpm} from ${SONG.bpm}`}
            </p>
          </div>
          {!original ? (
            <button
              type="button"
              onClick={() => onBpm(SONG.bpm)}
              className="h-9 rounded-full px-3 text-[12px] text-[var(--fg-2)] hover:bg-[var(--fill)] hover:text-[var(--fg)]"
            >
              Reset
            </button>
          ) : null}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <StepButton label="Slower" onHold={() => onBpm(bpm - 1)}>
            −
          </StepButton>
          <TempoRuler bpm={bpm} onBpm={onBpm} />
          <StepButton label="Faster" onHold={() => onBpm(bpm + 1)}>
            +
          </StepButton>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onBpm(p)}
              className={cn(
                "h-9 rounded-full px-3.5 text-[13px] transition-colors",
                p === bpm ? "bg-[var(--fg)] text-[var(--bg)]" : "text-[var(--fg-2)] hover:bg-[var(--fill)]",
              )}
              style={p !== bpm ? { background: "var(--fill)" } : undefined}
            >
              {p}
              {p === SONG.bpm ? <span className="ml-1 text-[10px] opacity-70">orig</span> : null}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

function TempoRuler({ bpm, onBpm }: { bpm: number; onBpm: (n: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = (bpm - 40) * 8 - el.clientWidth / 2 + 4;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [bpm]);

  return (
    <div ref={ref} className="no-scrollbar relative h-14 flex-1 overflow-x-auto overscroll-x-contain">
      <div className="relative h-full" style={{ width: (200 - 40) * 8 + 16 }}>
        {Array.from({ length: 161 }).map((_, i) => {
          const value = 40 + i;
          const major = value % 10 === 0;
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} BPM`}
              onClick={() => onBpm(value)}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: i * 8, width: 8 }}
            >
              <span
                className="w-px rounded-full"
                style={{
                  height: major ? 22 : 10,
                  background: value === bpm ? "var(--fg)" : "var(--hairline-2)",
                }}
              />
              {major ? <span className="mt-1 text-[9px] tabular-nums text-[var(--fg-3)]">{value}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepButton({ label, onHold, children }: { label: string; onHold: () => void; children: ReactNode }) {
  const timer = useRef<number | null>(null);
  const start = () => {
    onHold();
    let delay = 220;
    const loop = () => {
      onHold();
      delay = Math.max(40, delay * 0.86);
      timer.current = window.setTimeout(loop, delay);
    };
    timer.current = window.setTimeout(loop, delay);
  };
  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <motion.button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        start();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      whileTap={{ scale: 0.92 }}
      transition={SPRING_PRESS}
      className="grid size-11 shrink-0 place-items-center rounded-full text-[22px] font-medium"
      style={{ background: "var(--fill)" }}
    >
      {children}
    </motion.button>
  );
}

const WHITE = [
  { pc: 0, n: 0, name: "C" },
  { pc: 2, n: 1, name: "D" },
  { pc: 4, n: 2, name: "E" },
  { pc: 5, n: 3, name: "F" },
  { pc: 7, n: 4, name: "G" },
  { pc: 9, n: 5, name: "A" },
  { pc: 11, n: 6, name: "B" },
];
const BLACK = [
  { pc: 1, n: 1 },
  { pc: 3, n: 2 },
  { pc: 6, n: 4 },
  { pc: 8, n: 5 },
  { pc: 10, n: 6 },
];
const BASE_PC = 9;

export function KeySheet({
  open,
  onOpenChange,
  semitones,
  onSemitones,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semitones: number;
  onSemitones: (n: number) => void;
}) {
  const wrapped = ((semitones % 12) + 12) % 12;
  const index = (BASE_PC + wrapped) % 12;
  const name = `${transposeChord("A", semitones)}m`;
  const original = semitones === 0;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Key" description="Chords, bass, pad and melody transpose together">
      <div className="px-5 pb-6 pt-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[56px] font-semibold leading-none tracking-[-0.04em]">{name}</p>
            <p className="mt-2 text-[13px] text-[var(--fg-3)]">
              {original ? "Original key" : `${Math.abs(semitones)} ${Math.abs(semitones) === 1 ? "semitone" : "semitones"} ${semitones > 0 ? "up" : "down"}`}
            </p>
          </div>
          {!original ? (
            <button
              type="button"
              onClick={() => onSemitones(0)}
              className="h-9 rounded-full px-3 text-[12px] text-[var(--fg-2)] hover:bg-[var(--fill)] hover:text-[var(--fg)]"
            >
              Reset
            </button>
          ) : null}
        </div>

        <div className="relative mt-6 h-36">
          <div className="absolute inset-0 flex gap-1">
            {WHITE.map((k) => {
              const active = index === k.pc;
              return (
                <motion.button
                  key={k.name}
                  type="button"
                  aria-label={NOTE_NAMES[k.pc]}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onSemitones(k.pc - BASE_PC);
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={SPRING_PRESS}
                  className="relative h-full flex-1 rounded-[10px]"
                  style={{
                    background: active ? "var(--fg)" : "var(--surface-2)",
                    boxShadow: active ? "var(--shadow-float)" : "inset 0 0 0 0.5px var(--hairline)",
                  }}
                />
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[58%]">
            {BLACK.map((k) => {
              const active = index === k.pc;
              return (
                <motion.button
                  key={k.pc}
                  type="button"
                  aria-label={NOTE_NAMES[k.pc]}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSemitones(k.pc - BASE_PC);
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={SPRING_PRESS}
                  className="pointer-events-auto absolute top-0 h-full rounded-b-[8px]"
                  style={{
                    left: `calc((100% / 7) * ${k.n} - (100% / 7) * 0.32)`,
                    width: `calc(100% / 7 * 0.62)`,
                    background: active ? "var(--fg)" : "var(--fg-2)",
                    opacity: active ? 1 : 0.85,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex justify-center gap-6">
          {([-1, 1] as const).map((dir) => (
            <StepButton key={dir} label={dir === -1 ? "Flat" : "Sharp"} onHold={() => onSemitones(semitones + dir)}>
              {dir === -1 ? "♭" : "♯"}
            </StepButton>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

const STEM_ICONS = {
  vocals: Mic,
  drums: Drum,
  bass: Guitar,
  other: AudioLines,
} as const;

export function MixerSheet({
  open,
  onOpenChange,
  mix,
  levels,
  stemsJob,
  onStemLevel,
  onMute,
  onReset,
  onExtract,
  onCancelExtract,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mix: Record<StemId, MixState>;
  levels: Record<StemId, number>;
  stemsJob: JobState;
  onStemLevel: (id: StemId, level: number) => void;
  onMute: (id: StemId) => void;
  onReset: () => void;
  onExtract: () => void;
  onCancelExtract: () => void;
}) {
  const ready = stemsJob.status === "complete";
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Mixer" description="Independent buses from the mix">
      <div className="px-5 pb-6 pt-1">
        {!ready ? (
          <ExtractState kind="stems" job={stemsJob} onStart={onExtract} onCancel={onCancelExtract} compact />
        ) : (
          <div className="flex flex-col gap-1">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={onReset}
                className="h-8 rounded-full px-3 text-[12px] text-[var(--fg-3)] hover:bg-[var(--fill)] hover:text-[var(--fg)]"
              >
                Reset mix
              </button>
            </div>
            {STEMS.map((stem) => {
              const Icon = STEM_ICONS[stem.id];
              const state = mix[stem.id];
              const meter = levels[stem.id] ?? 0;
              return (
                <div key={stem.id} className="flex items-center gap-3 rounded-2xl px-1 py-2">
                  <button
                    type="button"
                    aria-label={`${state.muted ? "Unmute" : "Mute"} ${stem.label}`}
                    aria-pressed={state.muted}
                    onClick={() => onMute(stem.id)}
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full transition-colors",
                      state.muted ? "text-[var(--fg-3)]" : "text-[var(--fg)]",
                    )}
                    style={{ background: "var(--fill)" }}
                  >
                    <Icon className="size-[16px]" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[13px] font-medium">{stem.label}</span>
                      <span className="font-mono text-[11px] tabular-nums text-[var(--fg-3)]">
                        {state.muted ? "muted" : Math.round(state.level * 100)}
                      </span>
                    </div>
                    <div className="relative">
                      <Slider
                        value={state.level}
                        disabled={state.muted}
                        onChange={(v) => onStemLevel(stem.id, v)}
                        ariaLabel={`${stem.label} level`}
                      />
                      <span
                        className="pointer-events-none absolute bottom-0 left-0 h-[2px] rounded-full"
                        style={{ width: `${meter * 100}%`, background: "var(--fg)", opacity: 0.28 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
