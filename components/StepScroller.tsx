"use client";

import { useEffect, useRef, useState } from "react";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import type { Step } from "@/lib/guide-schema";
import { formatRange } from "@/lib/format";

const OWNER = { agent: "Your agent", human: "You", waiting: "Waiting on the provider" } as const;
// A step opens once it crosses this line (a fraction of the window's height).
const LINE = 0.35;

const timeOf = (s: Step) => (s.waitDays ? formatRange(s.waitDays, "day") : s.minutes ? formatRange(s.minutes, "min") : "");

// What to do on a step: shown in the sticky panel on wide screens, inline on phones.
function Action({ s, i, n }: { s: Step; i: number; n: number }) {
  return (
    <>
      <p className="step-panel-meta">Step {i + 1} of {n}{timeOf(s) && `, ${timeOf(s)}`}</p>
      <p className="step-panel-who"><span className="owner-chip">{OWNER[s.owner]}</span></p>
      {s.link ? (
        <a className="step-cta" href={s.link.url} target="_blank" rel="noreferrer">
          {s.link.label}
          {s.link.prefilled && <span className="prefilled">pre-filled</span>}
        </a>
      ) : (
        s.owner === "waiting" && <p className="muted small">Nothing to do here but wait. The next step starts when the provider replies.</p>
      )}
      {s.technical && <p className="tech-text">{s.technical}</p>}
      <EvidenceBadge evidence={s.evidence} />
    </>
  );
}

// Steps as a timeline that opens each step as you scroll onto it, beside a sticky
// panel with what to do on the open step (after Stripe's quickstart layout).
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

  const s = steps[active] ?? steps[0];
  if (!s) return null;

  return (
    <div className="steps-layout">
      <ol className="step-tl">
        {steps.map((x, i) => {
          const on = i === active;
          const opened = on || reached.has(i);
          return (
            <li
              key={x.id}
              id={`step-${x.id}`}
              ref={(el) => { items.current[i] = el; }}
              className={`st-item ${x.owner}${on ? " on" : ""}${i < active ? " done" : ""}`}
            >
              <span className="st-dot" aria-hidden>{i + 1}</span>
              <button type="button" className="st-head" onClick={(e) => open(i, e.timeStamp)} aria-expanded={on}>
                <span className="st-title">{x.title}</span>
                <span className="st-meta">{OWNER[x.owner]}{timeOf(x) && `, ${timeOf(x)}`}</span>
              </button>
              {opened && (
                <div className="st-body">
                  <p>{x.plain}</p>
                  {x.whyHuman && <p className="why">{x.whyHuman}</p>}
                  <div className="st-action"><Action s={x} i={i} n={steps.length} /></div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <aside className={`step-panel ${s.owner}`} aria-live="polite" key={s.id}>
        <Action s={s} i={active} n={steps.length} />
      </aside>
    </div>
  );
}
