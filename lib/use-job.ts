"use client";

import { useEffect, useState } from "react";
import type { Job } from "@/lib/jobs";

// Polls a research job until it finishes.
export function useJob(id: number | null, intervalMs = 1500): Job | null {
  const [job, setJob] = useState<Job | null>(null);
  useEffect(() => {
    if (id == null) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const res = await fetch(`/api/generate/${id}`, { cache: "no-store" });
        if (res.ok) {
          const j = (await res.json()) as Job;
          if (!stop) setJob(j);
          if (j.status !== "started") return;
        }
      } catch {}
      if (!stop) timer = setTimeout(tick, intervalMs);
    };
    tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [id, intervalMs]);
  return job;
}

export function useElapsed(startedAt: string | undefined, running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  return startedAt ? Math.max(0, Math.round((now - Date.parse(startedAt)) / 1000)) : 0;
}

export function mmss(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
