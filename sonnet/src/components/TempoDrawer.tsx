import { BottomSheet } from "./BottomSheet";

const PRESETS = [
  { label: "Practice", mult: 0.75 },
  { label: "Original", mult: 1 },
  { label: "Up-tempo", mult: 1.15 },
];

export function TempoDrawer({
  open,
  onClose,
  bpm,
  baseBpm,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  bpm: number;
  baseBpm: number;
  onChange: (bpm: number) => void;
}) {
  const min = Math.round(baseBpm * 0.6);
  const max = Math.round(baseBpm * 1.4);

  return (
    <BottomSheet open={open} onClose={onClose} title="Tempo">
      <div className="flex flex-col gap-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="tabular text-[34px] font-semibold leading-none tracking-tight">{bpm}</p>
            <p className="mt-1 text-[12px]" style={{ color: "var(--fg-3)" }}>
              beats per minute
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onChange(Math.max(min, bpm - 1))}
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-[15px]"
              style={{ background: "var(--fill)" }}
            >
              −
            </button>
            <button
              onClick={() => onChange(Math.min(max, bpm + 1))}
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-[15px]"
              style={{ background: "var(--fill)" }}
            >
              +
            </button>
          </div>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={bpm}
          onChange={(e) => onChange(Number(e.target.value))}
        />

        <div className="flex gap-2">
          {PRESETS.map((p) => {
            const target = Math.round(baseBpm * p.mult);
            const active = target === bpm;
            return (
              <button
                key={p.label}
                onClick={() => onChange(target)}
                className="focus-ring flex-1 rounded-xl py-2.5 text-[12.5px] font-medium transition-colors"
                style={{
                  background: active ? "var(--accent-soft)" : "var(--fill)",
                  color: active ? "var(--accent)" : "var(--fg-2)",
                  border: active ? "1px solid var(--accent)" : "1px solid transparent",
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}
