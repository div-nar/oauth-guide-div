"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AgentEvent } from "@/lib/agent/events";

const LABEL = { status: "Note", search: "Searching", read: "Reading" } as const;

export function GenerateFeed({ query }: { query: string }) {
  const router = useRouter();
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t0 = Date.now();
    const tick = setInterval(() => setSeconds(Math.round((Date.now() - t0) / 1000)), 1000);

    (async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "The request failed. Try again.");
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const p of parts) {
            if (!p.startsWith("data: ")) continue;
            const e = JSON.parse(p.slice(6)) as AgentEvent;
            if (e.type === "done") router.replace(`/guides/${e.slug}`);
            else if (e.type === "error") setError(e.message);
            else setEvents((xs) => [...xs, e]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "The request failed. Try again.");
      } finally {
        clearInterval(tick);
      }
    })();
    return () => clearInterval(tick);
  }, [query, router]);

  if (!query) return <p className="error">Enter an app name on the home page to start.</p>;

  return (
    <div>
      <p className="small muted" aria-live="polite">
        {error ? "Stopped" : `Working for ${seconds}s. Most apps take 40 to 90 seconds.`}
      </p>
      {error && (
        <p className="error" role="alert">
          {error} <Link href="/">Back to the guides</Link>
        </p>
      )}
      <ul className="feed">
        {events.map((e, i) =>
          e.type === "done" || e.type === "error" ? null : (
            <li key={i}>
              <span className="k">{LABEL[e.type]}</span>
              {e.type === "search" && e.query}
              {e.type === "read" && (
                <a href={e.url} target="_blank" rel="noreferrer">{e.url}</a>
              )}
              {e.type === "status" && e.text}
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
