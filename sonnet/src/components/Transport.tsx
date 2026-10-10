import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { formatTime } from "../utils/format";

export function Transport({
  isPlaying,
  onToggle,
  playhead,
  duration,
  onSeek,
  onSeekBy,
  bpm,
  keyLabel,
  onOpenTempo,
  onOpenKey,
}: {
  isPlaying: boolean;
  onToggle: () => void;
  playhead: number;
  duration: number;
  onSeek: (s: number) => void;
  onSeekBy: (delta: number) => void;
  bpm: number;
  keyLabel: string;
  onOpenTempo: () => void;
  onOpenKey: () => void;
}) {
  return (
    <div
      className="shrink-0 px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-4"
      style={{ borderTop: "1px solid var(--hairline)", background: "var(--surface)" }}
    >
      <div className="mb-1 flex items-center gap-3">
        <span className="tabular w-9 text-[11px]" style={{ color: "var(--fg-3)" }}>
          {formatTime(playhead)}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(duration, 0.01)}
          step={0.01}
          value={Math.min(playhead, duration)}
          onChange={(e) => onSeek(Number(e.target.value))}
        />
        <span className="tabular w-9 text-right text-[11px]" style={{ color: "var(--fg-3)" }}>
          {formatTime(duration)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={onOpenTempo}
          className="focus-ring flex flex-col items-center rounded-xl px-3 py-1.5 transition-colors hover:brightness-110"
          style={{ background: "var(--fill)" }}
        >
          <span className="tabular text-[13px] font-semibold leading-none">{Math.round(bpm)}</span>
          <span className="mt-0.5 text-[9.5px] tracking-wide" style={{ color: "var(--fg-3)" }}>
            BPM
          </span>
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onSeekBy(-5)}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90"
            style={{ color: "var(--fg-2)" }}
            aria-label="Back 5 seconds"
          >
            <RotateCcw size={19} />
          </button>
          <button
            onClick={onToggle}
            className="focus-ring flex h-16 w-16 items-center justify-center rounded-full transition-transform active:scale-95"
            style={{ background: "var(--fg)", color: "var(--bg)" }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={() => onSeekBy(5)}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90"
            style={{ color: "var(--fg-2)" }}
            aria-label="Forward 5 seconds"
          >
            <RotateCw size={19} />
          </button>
        </div>

        <button
          onClick={onOpenKey}
          className="focus-ring flex flex-col items-center rounded-xl px-3 py-1.5 transition-colors hover:brightness-110"
          style={{ background: "var(--fill)" }}
        >
          <span className="text-[13px] font-semibold leading-none">{keyLabel}</span>
          <span className="mt-0.5 text-[9.5px] tracking-wide" style={{ color: "var(--fg-3)" }}>
            KEY
          </span>
        </button>
      </div>
    </div>
  );
}
