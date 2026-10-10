import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import type { ExtractionState } from "../hooks/useTransport";

function ProcessingGlyph() {
  const bars = [0, 1, 2, 3];
  return (
    <div className="flex h-4 items-end gap-[3px]">
      {bars.map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: "var(--accent)" }}
          animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.12,
          }}
        />
      ))}
    </div>
  );
}

export function ExtractGate({
  icon,
  title,
  description,
  actionLabel,
  state,
  onExtract,
  variant = "panel",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  state: ExtractionState;
  onExtract: () => void;
  variant?: "panel" | "ribbon";
}) {
  const compact = variant === "ribbon";

  return (
    <div
      className={cnPad(compact)}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--hairline)",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state.status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className={compact ? "flex items-center justify-between gap-3" : "flex flex-col items-start gap-3"}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--fill)", color: "var(--fg-2)" }}
              >
                {icon}
              </div>
              <div>
                <p className="text-[13.5px] font-medium" style={{ color: "var(--fg)" }}>
                  {title}
                </p>
                {!compact && (
                  <p className="mt-0.5 text-[12.5px] leading-snug" style={{ color: "var(--fg-3)" }}>
                    {description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onExtract}
              className="focus-ring shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors"
              style={{ background: "var(--accent)", color: "#1b1406" }}
              onMouseDown={(e) => e.currentTarget.style.setProperty("transform", "scale(0.97)")}
              onMouseUp={(e) => e.currentTarget.style.setProperty("transform", "scale(1)")}
            >
              {actionLabel}
            </button>
          </motion.div>
        )}

        {state.status === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-2.5"
          >
            <div className="flex items-center gap-3">
              <ProcessingGlyph />
              <AnimatePresence mode="wait">
                <motion.p
                  key={state.label}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.18 }}
                  className="text-[12.5px]"
                  style={{ color: "var(--fg-2)" }}
                >
                  {state.label}
                </motion.p>
              </AnimatePresence>
              <span className="ml-auto tabular text-[12px]" style={{ color: "var(--fg-3)" }}>
                {Math.round(state.progress)}%
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--fill)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--accent)" }}
                animate={{ width: `${state.progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cnPad(compact: boolean) {
  return compact
    ? "rounded-2xl px-4 py-3.5"
    : "rounded-2xl px-5 py-5";
}
