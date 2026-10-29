"use client";

import { useEffect, useRef, useState } from "react";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { PathVisual } from "@/components/PathVisual";
import type { Step } from "@/lib/guide-schema";
import { formatRange } from "@/lib/format";

const OWNER = { agent: "Your agent", human: "You", waiting: "Waiting on the provider" } as const;
// Pixels of scrolling per step: about one mouse-wheel notch.
const STEP_PX = 120;
// Where the panel sticks, matching .step-stage's top.
const STICK = 16;

const timeOf = (s: Step) => (s.waitDays ? formatRange(s.waitDays, "day") : s.minutes ? formatRange(s.minutes, "min") : "");

// The path strip and one step card stay frozen while you scroll. Scrolling fills
// the strip like a progress bar and swaps the card to each step in turn.
export function StepScroller({ steps }: { steps: Step[] }) {
  const [pos, setPos] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const n = steps.length;

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = wrap.current;
      if (el) setPos(Math.min(Math.max((STICK - el.getBoundingClientRect().top) / STEP_PX, 0), n - 0.001));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [n]);

  const active = Math.floor(pos);
  const go = (i: number) => {
    const el = wrap.current;
    if (!el) return;
    const k = Math.max(0, Math.min(n - 1, i));
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - STICK + k * STEP_PX + STEP_PX / 2, behavior: "smooth" });
  };

  const s = steps[active] ?? steps[0];
  if (!s) return null;

  return (
    <div
      ref={wrap}
      className="step-scroll"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + 1);
        if (e.key === "ArrowLeft") go(active - 1);
      }}
    >
      {/* Anchors for #step-<id> links, one scroll stop apart. */}
      {steps.map((x, i) => (
        <span key={x.id} id={`step-${x.id}`} className="step-anchor" style={{ top: i * STEP_PX + STEP_PX / 2 }} aria-hidden />
      ))}
      <div className="step-stage">
        <PathVisual steps={steps} active={active} progress={pos - active} onSelect={go} />
        <article className={`step-card ${s.owner}`} aria-live="polite" key={s.id}>
          <header className="step-card-head">
            <span className="owner-chip">{OWNER[s.owner]}</span>
            <span className="step-card-count">Step {active + 1} of {n}{timeOf(s) && `, ${timeOf(s)}`}</span>
          </header>
          <h3 className="step-card-title">{s.title}</h3>
          <p>{s.plain}</p>
          {s.whyHuman && <p className="why">{s.whyHuman}</p>}
          {s.link && (
            <a className="step-cta" href={s.link.url} target="_blank" rel="noreferrer">
              {s.link.label}
              {s.link.prefilled && <span className="prefilled">pre-filled</span>}
            </a>
          )}
          {s.owner === "waiting" && !s.link && <p className="why">Nothing to do but wait. The next step starts when the provider replies.</p>}
          {s.technical && <p className="tech-text">{s.technical}</p>}
          <EvidenceBadge evidence={s.evidence} />
        </article>
        <nav className="step-nav" aria-label="Move between steps">
          <button type="button" onClick={() => go(active - 1)} disabled={active === 0}>Previous</button>
          <span>Scroll, or use the arrows</span>
          <button type="button" onClick={() => go(active + 1)} disabled={active === n - 1}>Next</button>
        </nav>
      </div>
      {/* Scroll room for the frozen panel: sticky elements cannot move into padding. */}
      <div style={{ height: n * STEP_PX }} aria-hidden />
    </div>
  );
}
