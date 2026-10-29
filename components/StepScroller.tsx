"use client";

import { useEffect, useRef, useState } from "react";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { PathVisual } from "@/components/PathVisual";
import type { Step } from "@/lib/guide-schema";
import { formatRange } from "@/lib/format";

const OWNER = { agent: "Your agent", human: "You", waiting: "Waiting on the provider" } as const;

// The path and its steps in one pinned panel. Scrolling moves through the steps one
// at a time; each step has an invisible marker in the page flow that carries its
// #step-<id> anchor, so permalinks and the journey dots land on the right step.
export function StepScroller({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState(0);
  const markers = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-20% 0px -80% 0px" },
    );
    markers.current.forEach((m) => m && io.observe(m));
    return () => io.disconnect();
  }, [steps]);

  const go = (i: number) => markers.current[Math.max(0, Math.min(steps.length - 1, i))]?.scrollIntoView({ behavior: "smooth" });
  const s = steps[active] ?? steps[0];
  if (!s) return null;
  const time = s.waitDays ? formatRange(s.waitDays, "day") : s.minutes ? formatRange(s.minutes, "min") : "";

  return (
    <div className="scrolly" style={{ "--n": steps.length } as React.CSSProperties}>
      <div className="scrolly-panel">
        <PathVisual steps={steps} active={active} />
        <article className={`step-card ${s.owner}`} aria-live="polite" key={s.id}>
          <header className="step-card-head">
            <span className="owner-chip">{OWNER[s.owner]}</span>
            <span className="muted small">Step {active + 1} of {steps.length}{time && `, ${time}`}</span>
          </header>
          <h3>{s.title}</h3>
          <p>{s.plain}</p>
          {s.whyHuman && <p className="why">{s.whyHuman}</p>}
          {s.technical && <p className="tech-text">{s.technical}</p>}
          {s.link && (
            <a className="step-cta" href={s.link.url} target="_blank" rel="noreferrer">
              {s.link.label}
              {s.link.prefilled && <span className="prefilled">pre-filled</span>}
            </a>
          )}
          <EvidenceBadge evidence={s.evidence} />
        </article>
        <nav className="step-nav" aria-label="Steps">
          <button type="button" className="btn secondary" onClick={() => go(active - 1)} disabled={active === 0}>Previous</button>
          <span className="muted small scroll-hint">Scroll to move through the steps</span>
          <button type="button" className="btn secondary" onClick={() => go(active + 1)} disabled={active === steps.length - 1}>Next</button>
        </nav>
      </div>
      <div className="scrolly-markers" aria-hidden>
        {steps.map((x, i) => (
          <div key={x.id} id={`step-${x.id}`} data-i={i} ref={(el) => { markers.current[i] = el; }} />
        ))}
      </div>
    </div>
  );
}
