import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Guitar, FileText, SlidersHorizontal } from "lucide-react";
import type { TransportApi } from "../hooks/useTransport";
import { Header } from "./Header";
import { Visualizer } from "./Visualizer";
import { ChordRibbon } from "./ChordRibbon";
import { ChordDiagramsPanel } from "./ChordDiagramsPanel";
import { LyricsPanel } from "./LyricsPanel";
import { Transport } from "./Transport";
import { TempoDrawer } from "./TempoDrawer";
import { KeyDrawer } from "./KeyDrawer";
import { MixerDrawer } from "./MixerDrawer";
import { noteName } from "../lib/theory";

function TogglePill({
  active,
  disabled,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="focus-ring flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-medium transition-all"
      style={{
        background: active ? "var(--accent-soft)" : "var(--fill)",
        color: active ? "var(--accent)" : disabled ? "var(--fg-3)" : "var(--fg-2)",
        opacity: disabled ? 0.5 : 1,
        border: active ? "1px solid var(--accent)" : "1px solid transparent",
      }}
      title={disabled ? "Detect chords first to unlock" : undefined}
    >
      {icon}
      {label}
    </button>
  );
}

export function PlayerView({ t, onBack }: { t: TransportApi; onBack: () => void }) {
  const { song } = t;
  const [showDiagrams, setShowDiagrams] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [tempoOpen, setTempoOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [mixerOpen, setMixerOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input") {
        if (e.key === "Escape") (document.activeElement as HTMLElement).blur();
        return;
      }
      switch (e.key) {
        case " ":
          e.preventDefault();
          t.toggle();
          break;
        case "ArrowLeft":
          t.seekBy(-5);
          break;
        case "ArrowRight":
          t.seekBy(5);
          break;
        case "c":
        case "C":
          if (t.chordState.status === "ready") setShowDiagrams((v) => !v);
          break;
        case "l":
        case "L":
          setShowLyrics((v) => !v);
          break;
        case "m":
        case "M":
          setMixerOpen((v) => !v);
          break;
        case "t":
        case "T":
          setTempoOpen((v) => !v);
          break;
        case "k":
        case "K":
          setKeyOpen((v) => !v);
          break;
        case "Escape":
          if (tempoOpen) setTempoOpen(false);
          else if (keyOpen) setKeyOpen(false);
          else if (mixerOpen) setMixerOpen(false);
          else if (showDiagrams || showLyrics) {
            setShowDiagrams(false);
            setShowLyrics(false);
          } else onBack();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [t, tempoOpen, keyOpen, mixerOpen, showDiagrams, showLyrics, onBack]);

  if (!song) return null;

  const keyLabel = noteName((song.rootSemitone + t.transpose + 12) % 12);

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--surface)" }}>
      <Header song={song} onBack={onBack} />
      <Visualizer song={song} engine={t.engine} isPlaying={t.isPlaying} />

      <div className="flex flex-col gap-3 px-5 pb-3">
        <ChordRibbon
          song={song}
          engine={t.engine}
          transpose={t.transpose}
          barBeat={t.barBeat}
          chordState={t.chordState}
          onExtract={t.extractChords}
          onSeekSeconds={t.seekTo}
        />
        <div className="flex flex-wrap gap-2">
          <TogglePill
            active={showDiagrams}
            disabled={t.chordState.status !== "ready"}
            onClick={() => setShowDiagrams((v) => !v)}
            icon={<Guitar size={14} />}
            label="Chord shapes"
          />
          <TogglePill
            active={showLyrics}
            onClick={() => setShowLyrics((v) => !v)}
            icon={<FileText size={14} />}
            label="Lyrics"
          />
          <TogglePill
            active={mixerOpen}
            onClick={() => setMixerOpen((v) => !v)}
            icon={<SlidersHorizontal size={14} />}
            label="Mixer"
          />
        </div>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {showDiagrams && t.chordState.status === "ready" && (
              <motion.div
                key="diagrams"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <ChordDiagramsPanel song={song} transpose={t.transpose} />
              </motion.div>
            )}
            {showLyrics && (
              <motion.div
                key="lyrics"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <LyricsPanel
                  song={song}
                  playhead={t.playhead}
                  lyricsState={t.lyricsState}
                  onExtract={t.extractLyrics}
                  onSeekSeconds={t.seekTo}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {!showDiagrams && !showLyrics && (
            <div
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl px-5 py-10 text-center"
              style={{ border: "1px dashed var(--hairline-2)" }}
            >
              <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                Toggle chord shapes or lyrics above to view them here.
              </p>
            </div>
          )}
        </div>
      </div>

      <Transport
        isPlaying={t.isPlaying}
        onToggle={t.toggle}
        playhead={t.playhead}
        duration={t.duration}
        onSeek={t.seekTo}
        onSeekBy={t.seekBy}
        bpm={t.bpm}
        keyLabel={keyLabel}
        onOpenTempo={() => setTempoOpen(true)}
        onOpenKey={() => setKeyOpen(true)}
      />

      <TempoDrawer
        open={tempoOpen}
        onClose={() => setTempoOpen(false)}
        bpm={Math.round(t.bpm)}
        baseBpm={song.bpm}
        onChange={t.setBpm}
      />
      <KeyDrawer
        open={keyOpen}
        onClose={() => setKeyOpen(false)}
        rootSemitone={song.rootSemitone}
        transpose={t.transpose}
        onChange={t.setTranspose}
      />
      <MixerDrawer
        open={mixerOpen}
        onClose={() => setMixerOpen(false)}
        engine={t.engine}
        stemVolumes={t.stemVolumes}
        onChangeVolume={t.setStemVolume}
        stemsState={t.stemsState}
        onExtract={t.extractStems}
      />
    </div>
  );
}
