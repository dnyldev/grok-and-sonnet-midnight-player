import { motion } from "motion/react";
import { Header } from "@/components/Header";
import { Ribbon, type RibbonMode } from "@/components/Ribbon";
import { Transport, type DockId, type PanelId } from "@/components/Transport";
import { PanelHost } from "@/components/panels/PanelHost";
import { Visualizer } from "@/components/Visualizer";
import { EASE_OUT } from "@/lib/ease";
import { SONG } from "@/data/song";
import type { JobState } from "@/hooks/useExtraction";
import { cn } from "@/lib/utils";

interface PlayerShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: "night" | "day";
  onTheme: () => void;
  mode: RibbonMode;
  onMode: (mode: RibbonMode) => void;
  panels: PanelId[];
  mixerOpen: boolean;
  jobs: Record<"chords" | "lyrics" | "stems", JobState>;
  onPanel: (panel: DockId) => void;
  onClosePanel: (panel: PanelId) => void;
  onExtract: (kind: "chords" | "lyrics" | "stems") => void;
  onCancelExtract: (kind: "chords" | "lyrics" | "stems") => void;
  onToast: (message: string) => void;
  beat: number;
  playing: boolean;
  bpm: number;
  semitones: number;
  secPerBeat: number;
  onToggle: () => void;
  onSeek: (beat: number) => void;
  onSkip: (seconds: number) => void;
  onOpenTempo: () => void;
  onOpenKey: () => void;
}

export function PlayerShell(props: PlayerShellProps) {
  const { open, playing, beat, panels, jobs } = props;
  const anyPanel = panels.length > 0;

  return (
    <motion.div
      className={cn(
        "fixed inset-0 z-40 flex justify-center",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <motion.button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close player"
        className="absolute inset-0"
        style={{ background: "var(--scrim)" }}
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.32, ease: EASE_OUT }}
        onClick={() => props.onOpenChange(false)}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Now playing"
        initial={false}
        animate={open ? { y: 0, opacity: 1 } : { y: "8%", opacity: 0 }}
        transition={{ duration: 0.46, ease: EASE_OUT }}
        className="relative z-10 flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden sm:my-3 sm:h-[min(920px,calc(100dvh-24px))] sm:rounded-[28px] sm:border sm:border-[var(--hairline)]"
        style={{ background: "var(--sheet)", boxShadow: "var(--shadow-sheet)" }}
      >
        <Header
          playing={playing}
          theme={props.theme}
          mode={props.mode}
          panels={panels}
          mixerOpen={props.mixerOpen}
          jobs={jobs}
          onClose={() => props.onOpenChange(false)}
          onTheme={props.onTheme}
          onMode={props.onMode}
          onPanel={props.onPanel}
          onToast={props.onToast}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <Ribbon
              beat={beat}
              playing={playing}
              semitones={props.semitones}
              mode={props.mode}
              compact={anyPanel}
              chords={jobs.chords}
              onModeChange={props.onMode}
              onSeek={props.onSeek}
              onExtract={() => props.onExtract("chords")}
              onCancelExtract={() => props.onCancelExtract("chords")}
            />

            {!anyPanel ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-4">
                <img
                  src={SONG.cover}
                  alt=""
                  className="aspect-square w-full max-w-[280px] rounded-[28px] object-cover"
                  style={{ boxShadow: "var(--shadow-float)" }}
                />
                <div className="mt-5 text-center">
                  <h2 className="text-[22px] font-semibold tracking-[-0.03em]">{SONG.title}</h2>
                  <p className="mt-1 text-[14px] text-[var(--fg-2)]">
                    {SONG.artist} · {SONG.album}
                  </p>
                </div>
                <div className="mt-5 w-full max-w-[280px]">
                  <Visualizer height={28} />
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 pt-3">
                <PanelHost
                  panels={panels}
                  beat={beat}
                  playing={playing}
                  semitones={props.semitones}
                  jobs={{ chords: jobs.chords, lyrics: jobs.lyrics }}
                  onClose={props.onClosePanel}
                  onSeek={props.onSeek}
                  onExtract={props.onExtract}
                  onCancelExtract={props.onCancelExtract}
                />
              </div>
            )}
          </div>
        </div>

        <Transport
          playing={playing}
          beat={beat}
          bpm={props.bpm}
          semitones={props.semitones}
          secPerBeat={props.secPerBeat}
          onToggle={props.onToggle}
          onSeek={props.onSeek}
          onSkip={props.onSkip}
          onOpenTempo={props.onOpenTempo}
          onOpenKey={props.onOpenKey}
        />
      </motion.div>
    </motion.div>
  );
}
