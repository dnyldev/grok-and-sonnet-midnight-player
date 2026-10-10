import { useRef } from "react";
import { clamp, cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  ariaLabel: string;
}

export function Slider({ value, min = 0, max = 1, step = 0.01, disabled, onChange, ariaLabel }: SliderProps) {
  const track = useRef<HTMLDivElement>(null);
  const ratio = (value - min) / (max - min);

  const fromClientX = (clientX: number) => {
    const el = track.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const t = clamp((clientX - rect.left) / rect.width, 0, 1);
    const raw = min + t * (max - min);
    const snapped = Math.round(raw / step) * step;
    return clamp(snapped, min, max);
  };

  return (
    <div
      ref={track}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={cn("relative h-10 flex-1 cursor-pointer touch-none", disabled && "cursor-not-allowed opacity-40")}
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        onChange(fromClientX(e.clientX));
      }}
      onPointerMove={(e) => {
        if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
        onChange(fromClientX(e.clientX));
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(clamp(value - step * 5, min, max));
        if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(clamp(value + step * 5, min, max));
      }}
    >
      <div className="absolute top-1/2 h-[3px] w-full -translate-y-1/2 overflow-hidden rounded-full" style={{ background: "var(--fill)" }}>
        <div className="h-full origin-left rounded-full" style={{ width: `${ratio * 100}%`, background: "var(--fg)" }} />
      </div>
      <span
        className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: `${ratio * 100}%`, background: "var(--fg)", boxShadow: "var(--shadow-float)" }}
      />
    </div>
  );
}
