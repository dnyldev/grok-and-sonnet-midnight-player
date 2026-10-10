import { AnimatePresence, motion } from "motion/react";
import { Check, LoaderCircle } from "lucide-react";
import { EASE_OUT, SPRING_PRESS } from "@/lib/ease";
import { JOB_META, PIPELINES, jobIdFor, pipelineDuration, type JobKind } from "@/data/pipelines";
import type { JobState } from "@/hooks/useExtraction";
import { cn } from "@/lib/utils";

interface ExtractStateProps {
  kind: JobKind;
  job: JobState;
  onStart: () => void;
  onCancel: () => void;
  compact?: boolean;
  className?: string;
}

export function ExtractState({ kind, job, onStart, onCancel, compact, className }: ExtractStateProps) {
  const meta = JOB_META[kind];
  const stages = PIPELINES[kind];
  const stage = stages[Math.min(job.stageIndex, stages.length - 1)];
  const totalMs = pipelineDuration(kind);
  const remaining = Math.max(0, Math.round(((1 - job.progress) * totalMs) / 1000));

  return (
    <div className={cn("flex h-full min-h-[180px] flex-col justify-center", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {job.status === "idle" ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            className={cn("flex flex-col", compact ? "items-start gap-3 px-1" : "items-center px-6 text-center")}
          >
            <p className={cn("font-semibold tracking-[-0.02em] text-[var(--fg)]", compact ? "text-[15px]" : "text-[17px]")}>
              {meta.title} has not run
            </p>
            <p className={cn("max-w-[34ch] text-[13px] leading-relaxed text-[var(--fg-3)]", compact ? "text-left" : "")}>
              {meta.hint}
            </p>
            <motion.button
              type="button"
              onClick={onStart}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_PRESS}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-full px-5 text-[13.5px] font-medium"
              style={{ background: "var(--fg)", color: "var(--bg)" }}
            >
              {meta.action}
            </motion.button>
          </motion.div>
        ) : null}

        {job.status === "running" ? (
          <motion.div
            key="running"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            className="flex flex-col gap-4 px-1"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <LoaderCircle className="size-3.5 animate-spin text-[var(--fg-2)]" />
                  <p className="text-[13px] font-medium tracking-[-0.01em]">{meta.running}</p>
                </div>
                <p className="mt-1 text-[12.5px] text-[var(--fg-2)]">{stage.label}</p>
                <p className="mt-0.5 font-mono text-[11px] text-[var(--fg-3)]">{stage.detail}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-[13px] tabular-nums text-[var(--fg)]">{Math.round(job.progress * 100)}%</p>
                <p className="mt-0.5 text-[11px] text-[var(--fg-3)]">~{remaining}s left</p>
              </div>
            </div>

            <div className="h-[3px] overflow-hidden rounded-full" style={{ background: "var(--fill)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--fg)", width: `${Math.max(2, job.progress * 100)}%` }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
              />
            </div>

            <ol className="flex flex-col gap-1.5">
              {stages.map((s, i) => {
                const state = i < job.stageIndex ? "done" : i === job.stageIndex ? "live" : "wait";
                return (
                  <li key={s.id} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "grid size-3.5 place-items-center rounded-full",
                        state === "done" && "bg-[var(--fg)] text-[var(--bg)]",
                        state === "live" && "border border-[var(--fg)]",
                        state === "wait" && "border border-[var(--hairline-2)]",
                      )}
                    >
                      {state === "done" ? <Check className="size-2.5" strokeWidth={3} /> : null}
                      {state === "live" ? <span className="size-1.5 rounded-full bg-[var(--fg)] pulse-dot" /> : null}
                    </span>
                    <span className={cn("text-[12px]", state === "wait" ? "text-[var(--fg-3)]" : "text-[var(--fg-2)]")}>
                      {s.label}
                    </span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--fg-3)]">
                      {state === "done" ? "ok" : state === "live" ? "run" : "—"}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="flex items-center justify-between pt-1">
              <p className="font-mono text-[10.5px] tracking-[0.04em] text-[var(--fg-3)]">
                {jobIdFor(kind)} · stage {job.stageIndex + 1}/{stages.length}
              </p>
              <button
                type="button"
                onClick={onCancel}
                className="h-8 rounded-full px-3 text-[12px] text-[var(--fg-2)] transition-colors hover:bg-[var(--fill)] hover:text-[var(--fg)]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}


