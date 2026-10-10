import { useRef } from "react";
import { useAnimationFrame } from "framer-motion";
import { Music2 } from "lucide-react";
import type { AudioEngine } from "../audio/engine";
import type { Song } from "../data/types";

const BANDS = 22;

export function Visualizer({ song, engine, isPlaying }: { song: Song; engine: AudioEngine; isPlaying: boolean }) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useAnimationFrame(() => {
    const spectrum = isPlaying ? engine.getSpectrum(BANDS) : null;
    barsRef.current.forEach((el, i) => {
      if (!el) return;
      const v = spectrum ? spectrum[i] : 0;
      const h = 10 + v * 78;
      el.style.height = `${h}%`;
      el.style.opacity = `${0.35 + v * 0.65}`;
    });
  });

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${song.coverFrom}, ${song.coverTo})`,
          border: "1px solid var(--hairline-2)",
        }}
      >
        <Music2 size={22} color={song.accent} strokeWidth={1.6} />
      </div>
      <div className="flex h-16 flex-1 items-end gap-[3px] overflow-hidden rounded-lg">
        {Array.from({ length: BANDS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            className="flex-1 rounded-[2px]"
            style={{
              height: "10%",
              background: song.accent,
              transition: "height 0.09s ease-out, opacity 0.09s ease-out",
            }}
          />
        ))}
      </div>
    </div>
  );
}
