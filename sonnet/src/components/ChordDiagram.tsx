import { getChordDiagram, parseChord } from "../lib/theory";

const STRINGS = 6;
const FRETS_SHOWN = 4;
const W = 92;
const H = 104;
const PAD_X = 14;
const PAD_TOP = 20;
const PAD_BOTTOM = 10;

export function ChordDiagram({ symbol }: { symbol: string }) {
  const chord = parseChord(symbol);
  const diagram = getChordDiagram(chord.root, chord.quality);
  const stringGap = (W - PAD_X * 2) / (STRINGS - 1);
  const fretGap = (H - PAD_TOP - PAD_BOTTOM) / FRETS_SHOWN;
  const nut = diagram.baseFret === 0;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {!nut && (
          <text x={PAD_X - 10} y={PAD_TOP + fretGap * 0.7} fontSize="8" fill="var(--fg-3)">
            {diagram.baseFret + 1}fr
          </text>
        )}
        {/* nut or top line */}
        <rect
          x={PAD_X}
          y={PAD_TOP}
          width={W - PAD_X * 2}
          height={nut ? 2.5 : 1}
          fill={nut ? "var(--fg)" : "var(--hairline-2)"}
        />
        {/* frets */}
        {Array.from({ length: FRETS_SHOWN }).map((_, i) => (
          <line
            key={i}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_TOP + fretGap * (i + 1)}
            y2={PAD_TOP + fretGap * (i + 1)}
            stroke="var(--hairline-2)"
            strokeWidth={1}
          />
        ))}
        {/* strings */}
        {Array.from({ length: STRINGS }).map((_, i) => (
          <line
            key={i}
            x1={PAD_X + stringGap * i}
            x2={PAD_X + stringGap * i}
            y1={PAD_TOP}
            y2={H - PAD_BOTTOM}
            stroke="var(--hairline-2)"
            strokeWidth={1}
          />
        ))}
        {/* barre, drawn across the top edge (the fretted position itself) */}
        {diagram.barre && (
          <rect
            x={PAD_X - 3}
            y={PAD_TOP - 2.5}
            width={W - PAD_X * 2 + 6}
            height={5}
            rx={2.5}
            fill="var(--accent)"
          />
        )}
        {/* finger / open / mute markers */}
        {diagram.frets.map((f, i) => {
          const x = PAD_X + stringGap * i;
          if (f === "x") {
            return (
              <text key={i} x={x} y={PAD_TOP - 7} fontSize="8" textAnchor="middle" fill="var(--fg-3)">
                ×
              </text>
            );
          }
          if (f === 0) {
            if (!nut) return null; // covered by the barre itself
            return (
              <circle
                key={i}
                cx={x}
                cy={PAD_TOP - 7}
                r={3}
                fill="none"
                stroke="var(--fg-2)"
                strokeWidth={1.2}
              />
            );
          }
          const y = PAD_TOP + fretGap * (f - 0.5);
          return <circle key={i} cx={x} cy={y} r={4} fill="var(--accent)" />;
        })}
      </svg>
      <span className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--fg)" }}>
        {symbol}
      </span>
    </div>
  );
}
