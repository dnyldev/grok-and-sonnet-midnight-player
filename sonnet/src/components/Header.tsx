import { ChevronLeft } from "lucide-react";
import type { Song } from "../data/types";

export function Header({ song, onBack }: { song: Song; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 pb-1 pt-[max(18px,env(safe-area-inset-top))]">
      <button
        onClick={onBack}
        className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
        style={{ background: "var(--fill)", color: "var(--fg-2)" }}
        aria-label="Back to library"
      >
        <ChevronLeft size={19} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold tracking-tight">{song.title}</p>
        <p className="truncate text-[12px]" style={{ color: "var(--fg-3)" }}>
          {song.artist}
        </p>
      </div>
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-medium tracking-wide"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        {song.mood}
      </span>
    </div>
  );
}
