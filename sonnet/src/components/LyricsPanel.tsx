import { useEffect, useMemo, useRef } from "react";
import { FileText } from "lucide-react";
import type { Song } from "../data/types";
import { ExtractGate } from "./ExtractGate";
import type { ExtractionState } from "../hooks/useTransport";

export function LyricsPanel({
  song,
  playhead,
  lyricsState,
  onExtract,
  onSeekSeconds,
}: {
  song: Song;
  playhead: number;
  lyricsState: ExtractionState;
  onExtract: () => void;
  onSeekSeconds: (s: number) => void;
}) {
  const secPerBeat = 60 / song.bpm;
  const lines = useMemo(
    () =>
      song.lyrics.map((l) => ({
        text: l.text,
        time: (l.bar * 4 + l.beat) * secPerBeat,
      })),
    [song, secPerBeat]
  );

  const activeIndex = useMemo(() => {
    let idx = 0;
    lines.forEach((l, i) => {
      if (l.time <= playhead + 0.05) idx = i;
    });
    return idx;
  }, [lines, playhead]);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex]);

  if (lyricsState.status !== "ready") {
    return (
      <ExtractGate
        variant="panel"
        icon={<FileText size={16} />}
        title="Lyrics not transcribed yet"
        description="Transcribe the vocal to get synced, line-by-line lyrics for this track."
        actionLabel="Transcribe lyrics"
        state={lyricsState}
        onExtract={onExtract}
      />
    );
  }

  return (
    <div
      className="rounded-2xl"
      style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)" }}
    >
      <div className="flex items-center justify-between px-4 pt-3.5">
        <p className="text-[12.5px] font-medium" style={{ color: "var(--fg-2)" }}>
          Lyrics
        </p>
        <span className="text-[11.5px]" style={{ color: "var(--fg-3)" }}>
          synced
        </span>
      </div>
      <div
        ref={containerRef}
        className="scroll-thin max-h-56 overflow-y-auto px-2 py-3"
      >
        {lines.map((l, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={i}
              ref={active ? activeRef : undefined}
              onClick={() => onSeekSeconds(l.time)}
              className="focus-ring block w-full rounded-lg px-3 py-1.5 text-left text-[14.5px] leading-relaxed transition-all duration-300"
              style={{
                color: active ? "var(--fg)" : "var(--fg-3)",
                fontWeight: active ? 600 : 400,
                background: active ? "var(--fill)" : "transparent",
              }}
            >
              {l.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
