import { motion } from "framer-motion";
import { Music2, Play } from "lucide-react";
import { SONGS } from "../data/songs";
import type { Song } from "../data/types";

export function Library({ onSelect }: { onSelect: (song: Song) => void }) {
  return (
    <div className="flex h-full flex-col" style={{ background: "var(--surface)" }}>
      <div className="px-6 pb-2 pt-[max(28px,env(safe-area-inset-top))]">
        <p className="text-[11.5px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--fg-3)" }}>
          Library
        </p>
        <h1 className="mt-1.5 text-[24px] font-semibold tracking-tight">Midnight Player</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
          Pick a track to play it instantly. Chords, lyrics and stems are generated
          on demand — nothing is pre-analyzed.
        </p>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-2.5">
          {SONGS.map((song, i) => (
            <motion.button
              key={song.id}
              onClick={() => onSelect(song)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              className="focus-ring group flex items-center gap-3.5 rounded-2xl p-3 text-left transition-colors"
              style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)" }}
            >
              <div
                className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                style={{ background: `linear-gradient(135deg, ${song.coverFrom}, ${song.coverTo})` }}
              >
                <Music2 size={20} color={song.accent} strokeWidth={1.6} />
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ background: "rgba(0,0,0,0.35)" }}
                >
                  <Play size={16} fill="white" color="white" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium tracking-tight">{song.title}</p>
                <p className="truncate text-[12px]" style={{ color: "var(--fg-3)" }}>
                  {song.artist}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: "var(--fill)", color: "var(--fg-2)" }}
                >
                  {song.mood}
                </span>
                <span className="tabular text-[11px]" style={{ color: "var(--fg-3)" }}>
                  {song.bpm} BPM · {song.keyLabel}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-2">
        <p className="text-center text-[11px]" style={{ color: "var(--fg-3)" }}>
          Space to play · ← → to seek · C / L / M for chords, lyrics, mixer
        </p>
      </div>
    </div>
  );
}
