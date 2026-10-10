import { useEffect, useMemo, useRef } from "react";
import { TOTAL_BEATS, chordAtBeat, transposeChord } from "@/data/song";

const CELL_W = 56;
const GAP = 5;
const PITCH = CELL_W + GAP;

function ChordLabel({ label }: { label: string }) {
  const m = label.match(/^([A-G])([#b♯♭])?(.*)$/);
  const root = m ? m[1] : label;
  const acc = m?.[2] ?? "";
  const suf = m?.[3] ?? "";
  let inline = "";
  let sup = "";
  if (suf === "m") inline = "m";
  else if (suf.startsWith("m") && !suf.startsWith("maj")) {
    inline = "m";
    sup = suf.slice(1);
  } else sup = suf;

  return (
    <span className="flex items-baseline whitespace-nowrap">
      <span className="text-[22px] font-semibold leading-none tracking-[-0.03em]">{root}</span>
      {acc ? <span className="text-[15px] font-semibold leading-none tracking-[-0.02em]">{acc}</span> : null}
      {inline ? <span className="ml-px text-[15px] font-medium leading-none">{inline}</span> : null}
      {sup ? <sup className="ml-px text-[12px] font-medium leading-none">{sup}</sup> : null}
    </span>
  );
}

export function ChordStrip({ beat, semitones, onSeek }: { beat: number; semitones: number; onSeek: (beat: number) => void }) {
  const scroller = useRef<HTMLDivElement>(null);

  const labels = useMemo(() => {
    const out: (string | null)[] = [];
    let prev: string | null = null;
    for (let i = 0; i < TOTAL_BEATS; i++) {
      const name = transposeChord(chordAtBeat(i), semitones);
      out.push(name !== prev ? name : null);
      prev = name;
    }
    return out;
  }, [semitones]);

  const k = Math.max(0, Math.min(TOTAL_BEATS - 1, Math.floor(beat)));
  const frac = Math.max(0, Math.min(1, beat - Math.floor(beat)));

  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    const width = sc.clientWidth || 358;
    const visible = Math.max(4, Math.floor(width / PITCH));
    const start = Math.round(sc.scrollLeft / PITCH);
    const half = Math.floor(visible / 2);
    if (k >= start + visible) {
      let snap = k - half;
      while (snap > 0 && snap % 4 !== 0) snap -= 1;
      sc.scrollTo({ left: Math.max(0, snap * PITCH - GAP), behavior: "smooth" });
    }
  }, [k]);

  return (
    <div className="relative h-14 w-full overflow-hidden">
      <div ref={scroller} className="no-scrollbar h-full overflow-x-auto overflow-y-hidden">
        <div className="relative h-14" style={{ width: TOTAL_BEATS * PITCH - GAP }}>
          {labels.map((label, i) => {
            const past = i < k;
            const active = i === k;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Bar ${Math.floor(i / 4) + 1}, beat ${(i % 4) + 1}${label ? ` — ${label}` : ""}`}
                className="absolute top-0 flex h-14 w-14 items-center justify-center overflow-hidden rounded-[10px] transition-colors duration-200"
                style={{
                  left: i * PITCH,
                  background: active ? "var(--fill-strong)" : past ? "var(--fill)" : "var(--surface-2)",
                  color: active ? "var(--fg)" : past ? "var(--fg-3)" : "var(--fg-2)",
                }}
                onClick={() => onSeek(i)}
              >
                {i % 4 === 0 ? (
                  <span className="absolute bottom-0 left-0 top-0 w-[3px]" style={{ background: "var(--hairline-2)" }} />
                ) : null}
                {label ? <ChordLabel label={label} /> : null}
              </button>
            );
          })}
          <div
            className="pointer-events-none absolute top-1.5 bottom-1.5 z-10 w-[2px] rounded-full"
            style={{
              background: "var(--fg)",
              transform: `translateX(${k * PITCH + 5 + frac * (CELL_W - 10)}px)`,
              boxShadow: "0 0 10px 1px color-mix(in srgb, var(--fg) 35%, transparent)",
            }}
          />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8" style={{ background: "linear-gradient(90deg, var(--sheet), transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8" style={{ background: "linear-gradient(270deg, var(--sheet), transparent)" }} />
    </div>
  );
}
