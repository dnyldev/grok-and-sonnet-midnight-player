import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Library } from "@/components/Library";
import { PlayerShell } from "@/components/PlayerShell";
import { KeySheet, MixerSheet, TempoSheet } from "@/components/Drawers";
import { Toast } from "@/components/ui/Toast";
import type { DockId, PanelId } from "@/components/Transport";
import type { RibbonMode } from "@/components/Ribbon";
import { useTransport } from "@/hooks/useTransport";
import { useExtraction } from "@/hooks/useExtraction";
import { useToast } from "@/hooks/useToast";
import { JOB_META, type JobKind } from "@/data/pipelines";
import { EASE_OUT } from "@/lib/ease";

type Theme = "night" | "day";

export default function App() {
  const transport = useTransport();
  const extraction = useExtraction();
  const { toast, flash } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("night");
  const [mode, setMode] = useState<RibbonMode>("follow");
  const [panels, setPanels] = useState<PanelId[]>([]);
  const [tempoOpen, setTempoOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [mixerOpen, setMixerOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector("meta[name='theme-color']")?.setAttribute("content", theme === "night" ? "#0b0b0c" : "#ecebe7");
  }, [theme]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (sheetOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const togglePanel = useCallback((id: PanelId) => {
    setPanels((open) => (open.includes(id) ? open.filter((p) => p !== id) : [...open, id]));
  }, []);

  const closePanel = useCallback((id: PanelId) => {
    setPanels((open) => open.filter((p) => p !== id));
  }, []);

  const toggleDock = useCallback(
    (id: DockId) => {
      if (id === "mixer") {
        setMixerOpen((open) => !open);
        return;
      }
      togglePanel(id);
    },
    [togglePanel],
  );

  const openPanel = useCallback((id: DockId) => {
    if (id === "mixer") setMixerOpen(true);
    else setPanels((open) => (open.includes(id) ? open : [...open, id]));
    setSheetOpen(true);
  }, []);

  const startJob = useCallback(
    (kind: JobKind) => {
      extraction.start(kind);
      flash(`${JOB_META[kind].running}…`);
    },
    [extraction, flash],
  );

  const cancelJob = useCallback(
    (kind: JobKind) => {
      extraction.cancel(kind);
      flash("Job cancelled");
    },
    [extraction, flash],
  );

  const prevJobs = useRef(extraction.jobs);
  useEffect(() => {
    (["chords", "lyrics", "stems"] as const).forEach((kind) => {
      if (prevJobs.current[kind].status !== "complete" && extraction.jobs[kind].status === "complete") {
        flash(JOB_META[kind].done);
      }
    });
    prevJobs.current = extraction.jobs;
  }, [extraction.jobs, flash]);

  const toggle = transport.toggle;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      switch (event.key) {
        case " ":
          event.preventDefault();
          void toggle();
          break;
        case "ArrowLeft":
          transport.skip(-5);
          break;
        case "ArrowRight":
          transport.skip(5);
          break;
        case "c":
        case "C":
          togglePanel("chords");
          setSheetOpen(true);
          break;
        case "l":
        case "L":
          togglePanel("lyrics");
          setSheetOpen(true);
          break;
        case "m":
        case "M":
          setMixerOpen((open) => !open);
          setSheetOpen(true);
          break;
        case "t":
        case "T":
          setTempoOpen(true);
          break;
        case "k":
        case "K":
          setKeyOpen(true);
          break;
        case "f":
        case "F":
          setMode((m) => (m === "follow" ? "map" : "follow"));
          break;
        case "Escape":
          if (tempoOpen || keyOpen || mixerOpen) {
            setTempoOpen(false);
            setKeyOpen(false);
            setMixerOpen(false);
            return;
          }
          if (panels.length) {
            setPanels([]);
            return;
          }
          setSheetOpen(false);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, transport, togglePanel, tempoOpen, keyOpen, mixerOpen, panels.length]);

  const onTheme = useCallback(() => setTheme((t) => (t === "night" ? "day" : "night")), []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <motion.div
        className="min-h-screen origin-center"
        animate={{ scale: sheetOpen ? 0.978 : 1, opacity: sheetOpen ? 0.72 : 1 }}
        transition={{ duration: 0.42, ease: EASE_OUT }}
      >
        <Library
          playing={transport.playing}
          sheetOpen={sheetOpen}
          onToggle={() => void transport.toggle()}
          onOpen={() => setSheetOpen(true)}
          onOpenPanel={openPanel}
          onClose={() => setSheetOpen(false)}
        />
      </motion.div>

      <PlayerShell
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open && (tempoOpen || keyOpen || mixerOpen)) {
            setTempoOpen(false);
            setKeyOpen(false);
            setMixerOpen(false);
            return;
          }
          setSheetOpen(open);
        }}
        theme={theme}
        onTheme={onTheme}
        mode={mode}
        onMode={setMode}
        panels={panels}
        mixerOpen={mixerOpen}
        jobs={extraction.jobs}
        onPanel={toggleDock}
        onClosePanel={closePanel}
        onExtract={startJob}
        onCancelExtract={cancelJob}
        onToast={flash}
        beat={transport.beat}
        playing={transport.playing}
        bpm={transport.bpm}
        semitones={transport.semitones}
        secPerBeat={transport.secPerBeat}
        onToggle={() => void transport.toggle()}
        onSeek={transport.seekBeat}
        onSkip={transport.skip}
        onOpenTempo={() => setTempoOpen(true)}
        onOpenKey={() => setKeyOpen(true)}
      />

      <TempoSheet open={tempoOpen} onOpenChange={setTempoOpen} bpm={transport.bpm} onBpm={transport.setBpm} />
      <KeySheet open={keyOpen} onOpenChange={setKeyOpen} semitones={transport.semitones} onSemitones={transport.setSemitones} />
      <MixerSheet
        open={mixerOpen}
        onOpenChange={setMixerOpen}
        mix={transport.mix}
        levels={transport.levels}
        stemsJob={extraction.jobs.stems}
        onStemLevel={transport.setStemLevel}
        onMute={transport.toggleMute}
        onReset={transport.resetMix}
        onExtract={() => startJob("stems")}
        onCancelExtract={() => cancelJob("stems")}
      />

      <Toast toast={toast} />
    </div>
  );
}
