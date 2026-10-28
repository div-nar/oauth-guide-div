"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onJobsChange, readJobs, type TrackedJob, untrackJob } from "@/lib/research-store";
import { mmss, useElapsed, useJob } from "@/lib/use-job";

function Pill({ t }: { t: TrackedJob }) {
  const job = useJob(t.id, 3000);
  const running = !job || job.status === "started";
  const elapsed = useElapsed(job?.startedAt, running);
  if (job?.status === "done") {
    return (
      <span className="pill done">
        <Link href={`/guides/${t.slug}`} onClick={() => untrackJob(t.id)}>{t.query} guide ready</Link>
        <button type="button" aria-label="Dismiss" onClick={() => untrackJob(t.id)}>×</button>
      </span>
    );
  }
  if (job?.status === "failed") {
    return (
      <span className="pill failed">
        <Link href={`/generate?q=${encodeURIComponent(t.query)}&job=${t.id}`}>{t.query} research stopped</Link>
        <button type="button" aria-label="Dismiss" onClick={() => untrackJob(t.id)}>×</button>
      </span>
    );
  }
  return (
    <span className="pill running">
      <span className="pulse" aria-hidden />
      <Link href={`/generate?q=${encodeURIComponent(t.query)}&job=${t.id}`}>Researching {t.query} {mmss(elapsed)}</Link>
    </span>
  );
}

export function ResearchPill() {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  useEffect(() => {
    const load = () => setJobs(readJobs());
    load();
    return onJobsChange(load);
  }, []);
  if (!jobs.length) return null;
  return <div className="pills">{jobs.map((t) => <Pill key={t.id} t={t} />)}</div>;
}
