import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Keyboard,
  LayoutGrid,
  LayoutTemplate,
  ListMusic,
  Moon,
  MoreHorizontal,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import { SPRING_PANEL, SPRING_PRESS } from "@/lib/ease";
import { LYRICS, SONG } from "@/data/song";
import { cn } from "@/lib/utils";
import type { DockId, PanelId } from "@/components/Transport";
import type { JobState } from "@/hooks/useExtraction";

const PANELS: { id: DockId; label: string; Icon: typeof LayoutGrid }[] = [
  { id: "chords", label: "Chord diagrams", Icon: LayoutGrid },
  { id: "lyrics", label: "Lyrics", Icon: ListMusic },
  { id: "mixer", label: "Mixer", Icon: SlidersHorizontal },
];

interface HeaderProps {
  playing: boolean;
  theme: "night" | "day";
  mode: "follow" | "map";
  panels: PanelId[];
  mixerOpen: boolean;
  jobs: Record<"chords" | "lyrics" | "stems", JobState>;
  onClose: () => void;
  onTheme: () => void;
  onMode: (mode: "follow" | "map") => void;
  onPanel: (panel: DockId) => void;
  onToast: (message: string) => void;
}

export function Header({
  playing,
  theme,
  mode,
  panels,
  mixerOpen,
  jobs,
  onClose,
  onTheme,
  onMode,
  onPanel,
  onToast,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const downloadLrc = () => {
    if (jobs.lyrics.status !== "complete") {
      onToast("Transcribe lyrics first");
      return;
    }
    const secPerBeat = 60 / SONG.bpm;
    const stamp = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
    };
    const body = [
      `[ti:${SONG.title}]`,
      `[ar:${SONG.artist}]`,
      `[al:${SONG.album}]`,
      "",
      ...LYRICS.map((line) => `[${stamp(line.beat * secPerBeat)}]${line.text}`),
    ].join("\n");
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${SONG.title} - ${SONG.artist}.lrc`;
    link.click();
    URL.revokeObjectURL(url);
    onToast("LRC file downloaded");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      onToast("Link copied");
    } catch {
      onToast("Couldn't copy — grab it manually");
    }
  };

  const items = [
    {
      icon: LayoutTemplate,
      label: "Ribbon mode",
      value: mode === "follow" ? "Follow" : "Map",
      onClick: () => onMode(mode === "follow" ? "map" : "follow"),
    },
    {
      icon: theme === "night" ? Sun : Moon,
      label: "Appearance",
      value: theme === "night" ? "Night" : "Day",
      onClick: onTheme,
    },
    { icon: Download, label: "Download lyrics", value: ".lrc", onClick: downloadLrc },
    { icon: Copy, label: "Copy link", value: "url", onClick: copyLink },
  ];

  return (
    <header className="relative flex items-center justify-between gap-2 px-3 pb-1 pt-[max(8px,var(--safe-t))]">
      <motion.button
        type="button"
        aria-label="Close player"
        onClick={onClose}
        whileTap={{ scale: 0.9 }}
        transition={SPRING_PRESS}
        className="grid size-11 place-items-center rounded-full text-[var(--fg-2)] transition-colors hover:bg-[var(--fill)] hover:text-[var(--fg)]"
      >
        <ChevronDown className="size-[22px]" />
      </motion.button>

      <div className="flex items-center gap-2">
        {playing ? <span className="size-1.5 rounded-full bg-[var(--fg)] pulse-dot" /> : null}
        <div className="flex items-center gap-0.5 rounded-full p-0.5" style={{ background: "var(--fill)" }}>
          {PANELS.map(({ id, label, Icon }) => {
            const active = id === "mixer" ? mixerOpen : panels.includes(id);
            const job = id === "mixer" ? jobs.stems : jobs[id];
            const ready = job.status === "complete";
            const running = job.status === "running";
            return (
              <motion.button
                key={id}
                type="button"
                aria-label={label}
                aria-pressed={active}
                onClick={() => onPanel(id)}
                whileTap={{ scale: 0.9 }}
                transition={SPRING_PRESS}
                className="relative grid size-11 place-items-center rounded-full transition-colors"
                style={{ background: active ? "var(--fg)" : "transparent", color: active ? "var(--bg)" : "var(--fg-2)" }}
              >
                <Icon className="size-[18px]" />
                {ready && !active ? (
                  <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[var(--fg)]" />
                ) : null}
                {running && !active ? (
                  <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[var(--fg)] pulse-dot" />
                ) : null}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <motion.button
          type="button"
          aria-label="More"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          whileTap={{ scale: 0.9 }}
          transition={SPRING_PRESS}
          className={cn(
            "grid size-11 place-items-center rounded-full transition-colors",
            menuOpen ? "bg-[var(--fill)]" : "text-[var(--fg-2)] hover:bg-[var(--fill)] hover:text-[var(--fg)]",
          )}
        >
          <MoreHorizontal className="size-[20px]" />
        </motion.button>

        <AnimatePresence>
          {menuOpen ? (
            <>
              <motion.div
                className="fixed inset-0 z-30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={SPRING_PANEL}
                className="absolute right-0 top-[calc(100%+10px)] z-40 w-64 overflow-hidden rounded-2xl border border-[var(--hairline)] p-1.5"
                style={{ background: "var(--surface)", boxShadow: "var(--shadow-float)" }}
              >
                {items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.onClick();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-[var(--fill)]"
                  >
                    <span className="flex items-center gap-2.5">
                      <item.icon className="size-[17px] text-[var(--fg-2)]" />
                      <span className="text-[14px]">{item.label}</span>
                    </span>
                    <span className="text-[12px] text-[var(--fg-3)]">{item.value}</span>
                  </button>
                ))}

                <div className="mx-2 my-1.5 h-px" style={{ background: "var(--hairline)" }} />

                <div className="px-2.5 py-1.5">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[12px] text-[var(--fg-2)]">
                    <Keyboard className="size-3.5" />
                    Keyboard
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {["Space", "←", "→", "C", "L", "M", "T", "K"].map((k) => (
                      <kbd
                        key={k}
                        className="rounded-md px-1.5 py-0.5 text-[11px] text-[var(--fg-2)]"
                        style={{ background: "var(--fill)" }}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                  {jobs.chords.status === "complete" ? (
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--fg-3)]">
                      <Check className="size-3" /> Analysis ready
                    </p>
                  ) : null}
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
