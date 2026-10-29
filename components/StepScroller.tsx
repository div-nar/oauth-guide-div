"use client";

import { useEffect, useRef, useState } from "react";
import { EvidenceBadge, StepCheck } from "@/components/EvidenceBadge";
import { PathLegend, PathVisual } from "@/components/PathVisual";
import type { Checks, Step } from "@/lib/guide-schema";
import { formatRange } from "@/lib/format";

const OWNER = { agent: "Your agent", human: "You", waiting: "Waiting on the provider" } as const;

const timeOf = (s: Step) => (s.waitDays ? formatRange(s.waitDays, "day") : s.minutes ? formatRange(s.minutes, "min") : "");

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M9.5 2.5h4v4M13.5 2.5 7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Arrow({ left }: { left?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d={left ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// The path strip doubles as a progress bar above one step card. Move with the
// arrow keys while the steps are on screen, the arrow buttons, the dots, or a swipe.
export function StepScroller({ steps, checks }: { steps: Step[]; checks?: Checks | null }) {
  const n = steps.length;
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const root = useRef<HTMLDivElement>(null);
  const onScreen = useRef(false);
  const touchX = useRef<number | null>(null);

  const go = (i: number) => {
    const k = Math.max(0, Math.min(n - 1, i));
    setDir(k >= active ? 1 : -1);
    setActive(k);
    history.replaceState(null, "", `#step-${steps[k].id}`);
  };

  // Arrow keys work while the steps are visible, unless you are typing somewhere.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { onScreen.current = e.isIntersecting; }, { threshold: 0.3 });
    io.observe(el);
    const onKey = (e: KeyboardEvent) => {
      if (!onScreen.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable], dialog")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); setDir(1); setActive((a) => Math.min(n - 1, a + 1)); }
      if (e.key === "ArrowLeft") { e.preventDefault(); setDir(-1); setActive((a) => Math.max(0, a - 1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => { io.disconnect(); window.removeEventListener("keydown", onKey); };
  }, [n]);

  // Open the step named in the address (#step-<id>), as agents' permalinks do.
  useEffect(() => {
    const fromHash = () => {
      const i = steps.findIndex((s) => `#step-${s.id}` === window.location.hash);
      if (i >= 0) {
        setActive(i);
        root.current?.scrollIntoView({ block: "start" });
      }
    };
    const frame = requestAnimationFrame(fromHash);
    window.addEventListener("hashchange", fromHash);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", fromHash); };
  }, [steps]);

  const s = steps[active] ?? steps[0];
  if (!s) return null;

  return (
    <div
      ref={root}
      className="step-viewer"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const x0 = touchX.current;
        touchX.current = null;
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1));
      }}
    >
      {steps.map((x) => <span key={x.id} id={`step-${x.id}`} className="step-anchor" aria-hidden />)}
      <PathVisual steps={steps} active={active} onSelect={go} legend={false} />
      <article className={`step-card ${s.owner} from-${dir > 0 ? "right" : "left"}`} aria-live="polite" key={s.id}>
        <header className="step-card-head">
          <span className="owner-chip">{OWNER[s.owner]}</span>
          <span className="step-card-count">{active + 1} / {n}{timeOf(s) && <span className="step-card-time">, {timeOf(s)}</span>}</span>
          <span className="step-arrows">
            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous step" title="Previous step (←)"><Arrow left /></button>
            <button type="button" onClick={() => go(active + 1)} disabled={active === n - 1} aria-label="Next step" title="Next step (→)"><Arrow /></button>
          </span>
        </header>
        <h3 className="step-card-title">{s.title}</h3>
        <p>{s.plain}</p>
        {s.whyHuman && <p className="why">{s.whyHuman}</p>}
        {s.link && (
          <div className="step-cta-row">
            <a className="step-cta" href={s.link.url} target="_blank" rel="noreferrer">
              {s.link.label}
              {s.link.prefilled && <span className="prefilled">pre-filled</span>}
              <ExternalIcon />
            </a>
            <StepCheck step={s} checks={checks} />
          </div>
        )}
        {s.owner === "waiting" && !s.link && <p className="why">Nothing to do but wait. The next step starts when the provider replies.</p>}
        {s.technical && <p className="tech-text">{s.technical}</p>}
        <EvidenceBadge evidence={s.evidence} />
      </article>
      <div className="step-foot">
        <PathLegend steps={steps} />
        <p className="step-hint">Use ← → to move between steps</p>
      </div>
    </div>
  );
}
