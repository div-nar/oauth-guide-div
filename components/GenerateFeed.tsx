"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { TimedEvent } from "@/lib/jobs";
import { trackJob } from "@/lib/research-store";
import { mmss, useElapsed, useJob } from "@/lib/use-job";

const LABEL: Record<TimedEvent["type"], string> = {
  status: "Note",
  search: "Searched",
  read: "Read",
  done: "Guide ready",
  error: "Stopped",
};

function Detail({ e }: { e: TimedEvent }) {
  if (e.type === "search") return <span>{e.query}</span>;
  if (e.type === "read") return <a href={e.url} target="_blank" rel="noreferrer">{e.url}</a>;
  if (e.type === "status") return <span>{e.text}</span>;
  if (e.type === "error") return <span>{e.message}</span>;
  return <Link href={`/guides/${e.slug}`}>Open the guide</Link>;
}

type Option = { name: string; query: string; description: string };

export function GenerateFeed({ query, jobId, exact = false, refresh = false }: { query: string; jobId: number | null; exact?: boolean; refresh?: boolean }) {
  const router = useRouter();
  const [id, setId] = useState<number | null>(jobId);
  const [startError, setStartError] = useState<string | null>(null);
  const [options, setOptions] = useState<Option[] | null>(null);
  const requested = useRef(false);

  // Start (or reuse) a background job once; the URL then carries the job id so a
  // refresh or a later visit picks up the same run instead of starting a new one.
  useEffect(() => {
    if (id != null || !query || requested.current) return;
    requested.current = true;
    (async () => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, exact, refresh }),
      });
      const j = await res.json().catch(() => ({}));
      if (j.status === "ambiguous") return setOptions(j.options);
      if (!res.ok) return setStartError(j.error ?? "The request failed. Try again.");
      if (j.status === "done") return router.replace(`/guides/${j.slug}`);
      trackJob({ id: j.jobId, query, slug: j.slug });
      setId(j.jobId);
      router.replace(`/generate?q=${encodeURIComponent(query)}&job=${j.jobId}`);
    })();
  }, [id, query, router, exact, refresh]);

  const job = useJob(id);
  const running = !job || job.status === "started";
  const elapsed = useElapsed(job?.startedAt, running);
  const done = job?.events.find((e) => e.type === "done");

  useEffect(() => {
    if (done && done.type === "done") {
      const t = setTimeout(() => router.push(`/guides/${done.slug}`), 1200);
      return () => clearTimeout(t);
    }
  }, [done, router]);

  if (!query && id == null) return <p className="error">Enter an app name on the home page to start.</p>;
  if (options) {
    return (
      <div className="choices">
        <p className="research-meta">&ldquo;{query}&rdquo; could mean a few different apps. Which one?</p>
        {options.map((o) => (
          <Link key={o.query} className="card choice" href={`/generate?q=${encodeURIComponent(o.query)}&exact=1`}>
            <strong>{o.name}</strong>
            <span className="muted small">{o.description}</span>
          </Link>
        ))}
      </div>
    );
  }
  if (startError) return <p className="error" role="alert">{startError} <Link href="/">Back to the guides</Link></p>;

  const events = (job?.events ?? []).filter((e) => !(e.type === "status" && e.text.startsWith("Researching")));
  return (
    <div>
      <p className="research-meta" aria-live="polite">
        {running ? `Working, ${mmss(elapsed)}. Most apps take about 2 minutes.` : job?.status === "done" ? `Finished in ${mmss(elapsed)}.` : "Stopped."}
        {running && <span> You can keep browsing; progress follows you in the header.</span>}
      </p>
      <ol className="timeline">
        {events.map((e, i) => (
          <li key={i} className={`tl tl-${e.type}`}>
            <span className="tl-time">{mmss(Math.round(e.t / 1000))}</span>
            <span className="tl-dot" aria-hidden />
            <div className="tl-body">
              <span className="tl-label">{LABEL[e.type]}</span>
              <Detail e={e} />
            </div>
          </li>
        ))}
        {running && (
          <li className="tl tl-pending">
            <span className="tl-time">{mmss(elapsed)}</span>
            <span className="tl-dot" aria-hidden />
            <div className="tl-body"><span className="tl-label">Working</span><span>Reading docs and writing the guide</span></div>
          </li>
        )}
      </ol>
    </div>
  );
}
