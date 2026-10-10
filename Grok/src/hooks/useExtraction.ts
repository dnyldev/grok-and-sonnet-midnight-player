import { useCallback, useRef, useState } from "react";
import { PIPELINES, pipelineDuration, type JobKind } from "@/data/pipelines";

export type JobStatus = "idle" | "running" | "complete";

export interface JobState {
  status: JobStatus;
  progress: number;
  stageIndex: number;
  startedAt: number | null;
  completedAt: number | null;
}

const idleJob = (): JobState => ({
  status: "idle",
  progress: 0,
  stageIndex: 0,
  startedAt: null,
  completedAt: null,
});

export function useExtraction() {
  const [jobs, setJobs] = useState<Record<JobKind, JobState>>({
    chords: idleJob(),
    lyrics: idleJob(),
    stems: idleJob(),
  });
  const timers = useRef<Partial<Record<JobKind, number>>>({});
  const cancelled = useRef<Partial<Record<JobKind, boolean>>>({});

  const patch = useCallback((kind: JobKind, next: Partial<JobState>) => {
    setJobs((prev) => ({ ...prev, [kind]: { ...prev[kind], ...next } }));
  }, []);

  const cancel = useCallback((kind: JobKind) => {
    cancelled.current[kind] = true;
    if (timers.current[kind]) window.clearTimeout(timers.current[kind]);
    patch(kind, idleJob());
  }, [patch]);

  const start = useCallback((kind: JobKind) => {
    if (jobs[kind].status !== "idle") return;
    cancelled.current[kind] = false;
    const stages = PIPELINES[kind];
    const total = pipelineDuration(kind);
    const startedAt = Date.now();
    patch(kind, { status: "running", progress: 0.02, stageIndex: 0, startedAt, completedAt: null });

    const runStage = (index: number, elapsed: number) => {
      if (cancelled.current[kind]) return;
      if (index >= stages.length) {
        patch(kind, { status: "complete", progress: 1, stageIndex: stages.length - 1, completedAt: Date.now() });
        return;
      }
      patch(kind, { stageIndex: index });
      const stage = stages[index];
      const from = elapsed;
      const to = elapsed + stage.ms;
      const tick = (now: number) => {
        if (cancelled.current[kind]) return;
        const t = Math.min(1, (now - startedAt - from) / stage.ms);
        const eased = 1 - Math.pow(1 - t, 2.2);
        const progress = Math.min(0.98, (from + eased * stage.ms) / total);
        patch(kind, { progress, stageIndex: index });
        if (t < 1) {
          timers.current[kind] = window.setTimeout(() => tick(Date.now()), 32);
        } else {
          runStage(index + 1, to);
        }
      };
      tick(Date.now());
    };

    timers.current[kind] = window.setTimeout(() => runStage(0, 0), 180);
  }, [jobs, patch]);

  return { jobs, start, cancel };
}
