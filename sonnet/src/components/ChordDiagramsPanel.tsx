import { useMemo } from "react";
import type { Song } from "../data/types";
import { transposeChordSymbol } from "../lib/theory";
import { ChordDiagram } from "./ChordDiagram";

export function ChordDiagramsPanel({ song, transpose }: { song: Song; transpose: number }) {
  const unique = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of song.chords) {
      const t = transposeChordSymbol(c.chord, transpose);
      if (!seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
    return out;
  }, [song, transpose]);

  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12.5px] font-medium" style={{ color: "var(--fg-2)" }}>
          Chord shapes
        </p>
        <span className="text-[11.5px]" style={{ color: "var(--fg-3)" }}>
          {unique.length} unique
        </span>
      </div>
      <div className="grid grid-cols-3 gap-y-4 gap-x-2 sm:grid-cols-4">
        {unique.map((sym) => (
          <ChordDiagram key={sym} symbol={sym} />
        ))}
      </div>
    </div>
  );
}
