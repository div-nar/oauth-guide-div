"use client";

import { useEffect, useRef, useState } from "react";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import type { Step } from "@/lib/guide-schema";
import { formatRange } from "@/lib/format";

const OWNER = { agent: "Your agent", human: "You", waiting: "Waiting" } as const;
// A step opens once it crosses this line (a fraction of the window's height).
const LINE = 0.35;

const timeOf = (s: Step) => (s.waitDays ? formatRange(s.waitDays, "day") : s.minutes ? formatRange(s.minutes, "min") : "");

// A pinned index of every step beside the step cards. A card opens when you scroll
// onto it and stays open after, so nothing above your position changes height.
export function StepScroller({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLElement | null)[]>([]);
  // Steps open when you reach them and stay open, so nothing above the reading
  // position ever changes height and the page never jumps.
  const [reached, setReached] = useState<Set<number>>(() => new Set([0]));
  // While a click-scroll runs, scrolling should not pick a different step.
  const lockUntil = useRef(0);

  const show = (i: number) => {
    setActive(i);
    setReached((r) => (r.has(i) ? r : new Set(r).add(i)));
  };

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (performance.now() < lockUntil.current) return;
      const line = window.innerHeight * LINE;
      let i = 0;
      items.current.forEach((el, k) => {
        if (el && el.getBoundingClientRect().top <= line) i = k;
      });
      show(i);
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
  }, [steps]);

  // `at` is the click's timestamp, on the same clock as performance.now().
  const open = (i: number, at: number) => {
    lockUntil.current = at + 900;
    show(i);
    requestAnimationFrame(() => {
      const el = items.current[i];
      if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - window.innerHeight * LINE + 4, behavior: "smooth" });
    });
  };

  if (!steps.length) return null;

  return (
    <div className="steps-layout">
      <nav className="step-index" aria-label="Steps">
        <ol>
          {steps.map((x, i) => (
            <li key={x.id} className={`${x.owner}${i === active ? " on" : ""}${i < active ? " done" : ""}`}>
              <button type="button" onClick={(e) => open(i, e.timeStamp)} aria-current={i === active ? "step" : undefined}>
                <span className="step-index-num">{i + 1}</span>
                <span>{x.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <ol className="step-cards">
        {steps.map((x, i) => {
          const on = i === active;
          const opened = on || reached.has(i);
          return (
            <li
              key={x.id}
              id={`step-${x.id}`}
              ref={(el) => { items.current[i] = el; }}
              className={`step-card ${x.owner}${on ? " on" : ""}${opened ? " open" : ""}`}
            >
              <button type="button" className="step-card-head" onClick={(e) => open(i, e.timeStamp)} aria-expanded={opened}>
                <span className="step-index-num">{i + 1}</span>
                <span className="owner-chip">{OWNER[x.owner]}</span>
                <span className="step-card-title">{x.title}</span>
                <span className="muted small nowrap">{timeOf(x)}</span>
              </button>
              {opened && (
                <div className="step-card-body">
                  <p>{x.plain}</p>
                  {x.whyHuman && <p className="why">{x.whyHuman}</p>}
                  {x.link && (
                    <a className="step-cta" href={x.link.url} target="_blank" rel="noreferrer">
                      {x.link.label}
                      {x.link.prefilled && <span className="prefilled">pre-filled</span>}
                    </a>
                  )}
                  {x.technical && <p className="tech-text">{x.technical}</p>}
                  <EvidenceBadge evidence={x.evidence} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
