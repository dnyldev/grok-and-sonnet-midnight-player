import { SHARP_NAMES, noteName } from "../lib/theory";
import { BottomSheet } from "./BottomSheet";

export function KeyDrawer({
  open,
  onClose,
  rootSemitone,
  transpose,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  rootSemitone: number;
  transpose: number;
  onChange: (t: number) => void;
}) {
  const currentRoot = (rootSemitone + transpose + 12) % 12;

  return (
    <BottomSheet open={open} onClose={onClose} title="Key">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[34px] font-semibold leading-none tracking-tight">
            {noteName(currentRoot)}
          </p>
          <p className="mt-1 text-[12px]" style={{ color: "var(--fg-3)" }}>
            {transpose === 0 ? "original key" : `${transpose > 0 ? "+" : ""}${transpose} semitones`}
          </p>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {SHARP_NAMES.map((_, semitone) => {
            const shift = semitone - rootSemitone;
            const label = noteName(semitone);
            const active = ((rootSemitone + transpose) % 12 + 12) % 12 === semitone;
            return (
              <button
                key={semitone}
                onClick={() => onChange(shift)}
                className="focus-ring flex h-11 items-center justify-center rounded-xl text-[13.5px] font-medium transition-colors"
                style={{
                  background: active ? "var(--accent)" : "var(--fill)",
                  color: active ? "#1b1406" : "var(--fg-2)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onChange(0)}
          className="focus-ring self-start text-[12.5px] underline-offset-4 hover:underline"
          style={{ color: "var(--fg-3)" }}
        >
          Reset to original key
        </button>
      </div>
    </BottomSheet>
  );
}
