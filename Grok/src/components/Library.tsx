import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { House, LayoutGrid, ListMusic, Pause, Play, Search, SlidersHorizontal, X } from "lucide-react";
import { SPRING_PRESS } from "@/lib/ease";
import { NOW_PLAYING, TRACKS } from "@/data/library";
import type { DockId } from "@/components/Transport";
import { cn } from "@/lib/utils";

interface LibraryProps {
  playing: boolean;
  sheetOpen: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onOpenPanel: (panel: DockId) => void;
  onClose: () => void;
}

const TABS: { id: DockId | "home"; label: string; Icon: typeof House }[] = [
  { id: "home", label: "Library", Icon: House },
  { id: "chords", label: "Chords", Icon: LayoutGrid },
  { id: "lyrics", label: "Lyrics", Icon: ListMusic },
  { id: "mixer", label: "Mixer", Icon: SlidersHorizontal },
];

export function Library({ playing, sheetOpen, onToggle, onOpen, onOpenPanel, onClose }: LibraryProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TRACKS;
    return TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="relative min-h-full" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <header className="px-5 pb-3 pt-[max(18px,calc(var(--safe-t)+14px))]">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--fg-3)]">Midnight</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h1 className="text-[32px] font-semibold leading-none tracking-[-0.04em]">Library</h1>
          <span className="text-[13px] text-[var(--fg-3)]">{filtered.length} tracks</span>
        </div>
        <label className="mt-4 flex h-11 items-center gap-2 rounded-full px-3.5" style={{ background: "var(--fill)" }}>
          <Search className="size-4 shrink-0 text-[var(--fg-3)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles and artists"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-3)]"
          />
          {query ? (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="grid size-7 place-items-center rounded-full text-[var(--fg-3)] hover:text-[var(--fg)]">
              <X className="size-3.5" />
            </button>
          ) : null}
        </label>
      </header>

      <div className="pb-40">
        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-[15px] font-medium">No matching tracks</p>
            <p className="mt-1 text-[13px] text-[var(--fg-3)]">Try a different title or artist.</p>
          </div>
        ) : null}
        {filtered.map((track) => {
          const current = track.id === NOW_PLAYING.id;
          return (
            <button
              key={track.id}
              type="button"
              onClick={onOpen}
              className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-[var(--fill)]"
            >
              <img
                src={track.cover}
                alt=""
                className="size-12 rounded-[14px] object-cover"
                style={{ boxShadow: current ? "0 0 0 1px var(--fg)" : undefined }}
              />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-[15px] tracking-[-0.015em]", current && "font-medium")}>{track.title}</p>
                <p className="truncate text-[13px] text-[var(--fg-3)]">{track.artist}</p>
              </div>
              {current ? <span className="size-1.5 rounded-full bg-[var(--fg)]" /> : null}
              <span className="font-mono text-[12px] tabular-nums text-[var(--fg-3)]">{track.duration}</span>
            </button>
          );
        })}
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <div
              className={cn(
                "pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center px-3 transition-opacity duration-300",
                sheetOpen && "opacity-0",
              )}
              style={{ paddingBottom: "max(12px, var(--safe-b))" }}
            >
              <motion.div
                layout
                className={cn(
                  "mb-2 flex w-full max-w-[430px] items-center gap-2 rounded-[22px] border border-[var(--hairline)] p-1.5",
                  sheetOpen ? "pointer-events-none" : "pointer-events-auto",
                )}
                style={{ background: "var(--glass)", backdropFilter: "blur(22px) saturate(160%)", boxShadow: "var(--shadow-float)" }}
              >
                <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[16px] px-1 py-0.5 text-left">
                  <img src={NOW_PLAYING.cover} alt="" className="size-11 rounded-[12px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium tracking-[-0.015em]">{NOW_PLAYING.title}</p>
                    <p className="truncate text-[12px] text-[var(--fg-3)]">{NOW_PLAYING.artist}</p>
                  </div>
                </button>
                <motion.button
                  type="button"
                  aria-label={playing ? "Pause" : "Play"}
                  onClick={onToggle}
                  whileTap={{ scale: 0.9 }}
                  transition={SPRING_PRESS}
                  className="grid size-11 shrink-0 place-items-center rounded-full"
                  style={{ background: "var(--fg)", color: "var(--bg)" }}
                >
                  {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 translate-x-px" fill="currentColor" />}
                </motion.button>
              </motion.div>

              <div
                className={cn(
                  "flex w-full max-w-[430px] items-center rounded-[22px] border border-[var(--hairline)] p-1",
                  sheetOpen ? "pointer-events-none" : "pointer-events-auto",
                )}
                style={{ background: "var(--glass)", backdropFilter: "blur(22px) saturate(160%)" }}
              >
                {TABS.map(({ id, label, Icon }) => {
                  const active = id === "home";
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-label={label}
                      aria-current={active ? "page" : undefined}
                      onClick={() => (id === "home" ? onClose() : onOpenPanel(id))}
                      className="relative flex h-11 flex-1 items-center justify-center text-[var(--fg-2)]"
                    >
                      {active ? (
                        <motion.span
                          layoutId="tab-pill"
                          className="absolute inset-1 rounded-full"
                          style={{ background: "var(--fill-strong)" }}
                          transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        />
                      ) : null}
                      <span className="relative flex items-center gap-1.5">
                        <Icon className="size-[18px]" />
                        <span className={cn("hidden text-[12px] sm:inline", active && "text-[var(--fg)]")}>{label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}

      {sheetOpen ? <div className="pointer-events-none fixed inset-0 z-20" style={{ background: "var(--scrim)", opacity: 0.35 }} /> : null}
    </div>
  );
}
