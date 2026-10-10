import { useRef } from "react";
import { useAnimationFrame } from "framer-motion";
import { Disc3, Drum, Guitar, Mic, Waves } from "lucide-react";
import { SlidersHorizontal } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { ExtractGate } from "./ExtractGate";
import type { AudioEngine, StemKey } from "../audio/engine";
import type { ExtractionState } from "../hooks/useTransport";

const STEM_META: Record<StemKey, { label: string; icon: React.ReactNode }> = {
  vocal: { label: "Vocal", icon: <Mic size={15} /> },
  drums: { label: "Drums", icon: <Drum size={15} /> },
  bass: { label: "Bass", icon: <Guitar size={15} /> },
  pad: { label: "Pad", icon: <Waves size={15} /> },
  piano: { label: "Piano", icon: <Disc3 size={15} /> },
};

function LevelMeter({ engine, stem }: { engine: AudioEngine; stem: StemKey }) {
  const ref = useRef<HTMLDivElement>(null);
  useAnimationFrame(() => {
    if (!ref.current) return;
    const v = engine.getLevel(stem);
    ref.current.style.transform = `scaleX(${Math.max(0.04, v)})`;
  });
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full" style={{ background: "var(--fill)" }}>
      <div
        ref={ref}
        className="h-full origin-left rounded-full"
        style={{ background: "var(--accent)", transform: "scaleX(0.04)", transition: "transform 0.08s linear" }}
      />
    </div>
  );
}

export function MixerDrawer({
  open,
  onClose,
  engine,
  stemVolumes,
  onChangeVolume,
  stemsState,
  onExtract,
}: {
  open: boolean;
  onClose: () => void;
  engine: AudioEngine;
  stemVolumes: Record<StemKey, number>;
  onChangeVolume: (key: StemKey, v: number) => void;
  stemsState: ExtractionState;
  onExtract: () => void;
}) {
  const order: StemKey[] = ["vocal", "drums", "bass", "pad", "piano"];

  return (
    <BottomSheet open={open} onClose={onClose} title="Mixer">
      {stemsState.status !== "ready" ? (
        <ExtractGate
          variant="panel"
          icon={<SlidersHorizontal size={16} />}
          title="Stems not separated yet"
          description="Split this track into vocal, drums, bass, pad and piano stems to mix them individually."
          actionLabel="Separate stems"
          state={stemsState}
          onExtract={onExtract}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {order.map((key) => {
            const disabled = key === "vocal";
            return (
              <div key={key} className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: disabled ? "var(--surface-3)" : "var(--fill)",
                    color: disabled ? "var(--fg-3)" : "var(--fg-2)",
                  }}
                >
                  {STEM_META[key].icon}
                </div>
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: disabled ? "var(--fg-3)" : "var(--fg)" }}
                    >
                      {STEM_META[key].label}
                    </span>
                    {disabled ? (
                      <span className="text-[11px]" style={{ color: "var(--fg-3)" }}>
                        no vocal detected
                      </span>
                    ) : (
                      <span className="tabular text-[11px]" style={{ color: "var(--fg-3)" }}>
                        {Math.round(stemVolumes[key] * 100)}
                      </span>
                    )}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={disabled ? 0 : stemVolumes[key]}
                    disabled={disabled}
                    onChange={(e) => onChangeVolume(key, Number(e.target.value))}
                    style={{ opacity: disabled ? 0.35 : 1 }}
                  />
                  {!disabled && <LevelMeter engine={engine} stem={key} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
}
