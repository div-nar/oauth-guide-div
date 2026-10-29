"use client";

import { useEffect, useRef, useState } from "react";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { TechDetails } from "@/components/TechDetails";
import type { Step } from "@/lib/guide-schema";
import { formatRange } from "@/lib/format";

const OWNER = { agent: "Agent", human: "You", waiting: "Wait" } as const;

const timeOf = (s: Step) => (s.waitDays ? formatRange(s.waitDays, "day") : s.minutes ? formatRange(s.minutes, "min") : "");

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M9.5 2.5h4v4M13.5 2.5 7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg className="st-chev" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Every step on one vertical line, so the whole path and its waits show at once. One
// step is open at a time; #step-<id> links (agents' permalinks) open that step.
// A step reads as at most two short points; anything longer folds under "More detail".
export function stepPoints(plain: string): { points: string[]; rest: string } {
  const sentences = plain.split(/(?<=[.!?])\s+(?=[A-Z0-9`"'(])/).map((x) => x.trim()).filter(Boolean);
  return { points: sentences.slice(0, 2), rest: sentences.slice(2).join(" ") };
}

export function StepTimeline({ steps, waitTip }: { steps: Step[]; waitTip?: React.ReactNode }) {
  const [open, setOpen] = useState<string | null>(steps[0]?.id ?? null);
  const root = useRef<HTMLOListElement>(null);
  // Scroll once the linked step is open, so the step that closes above it can't shift it.
  const pendingScroll = useRef<string | null>(null);

  // Keyed on the step ids, not the array: the array is rebuilt on every render.
  const ids = steps.map((s) => s.id).join(" ");
  useEffect(() => {
    const list = ids.split(" ");
    const fromHash = () => {
      const id = window.location.hash.replace(/^#step-/, "");
      if (!list.includes(id)) return;
      setOpen(id);
      pendingScroll.current = id;
    };
    const frame = requestAnimationFrame(fromHash);
    window.addEventListener("hashchange", fromHash);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", fromHash); };
  }, [ids]);

  useEffect(() => {
    if (!open || pendingScroll.current !== open) return;
    pendingScroll.current = null;
    document.getElementById(`step-${open}`)?.scrollIntoView({ block: "start" });
  }, [open]);

  // Previous / Next: open that step and keep it in view.
  const go = (i: number) => {
    const id = steps[i]?.id;
    if (!id) return;
    setOpen(id);
    pendingScroll.current = id;
    history.replaceState(null, "", `#step-${id}`);
  };

  const toggle = (id: string) => {
    const next = open === id ? null : id;
    setOpen(next);
    if (next) history.replaceState(null, "", `#step-${next}`);
  };

  const waits = steps.filter((s) => s.owner === "waiting").length;
  let n = 0;
  return (
    <>
      <p className="st-summary">{steps.length - waits} steps{waits ? `, ${waits === 1 ? "1 wait" : `${waits} waits`} for the provider` : ""}</p>
      <ol className="st-list" ref={root}>
        {steps.map((s, i) => {
          const isOpen = open === s.id;
          const wait = s.owner === "waiting";
          if (!wait) n++;
          return (
            <li key={s.id} id={`step-${s.id}`} className={`st-step ${s.owner}${isOpen ? " open" : ""}`}>
              <button type="button" className="st-row" aria-expanded={isOpen} onClick={() => toggle(s.id)}>
                {wait ? <span className="st-hourglass" aria-hidden>⏳</span> : <span className={`st-num ${s.owner}`}>{n}</span>}
                <span className="st-title">{s.title}</span>
                {wait ? (
                  <span className="st-wait">{timeOf(s)}{s.evidence.level === "uncertain" && <sup title={s.evidence.note ?? "Our estimate. The provider does not publish this time."}>est.</sup>}</span>
                ) : (
                  <>
                    <span className={`st-who ${s.owner}`}>{OWNER[s.owner]}</span>
                    <span className="st-time">{timeOf(s)}</span>
                  </>
                )}
                <Chevron />
              </button>
              {isOpen && (
                <div className="st-body">
                  <ul className="st-points">{stepPoints(s.plain).points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
                  {s.whyHuman && <p className="why">{s.whyHuman}</p>}
                  {s.link && (
                    <a className="step-cta" href={s.link.url} target="_blank" rel="noreferrer">
                      {s.link.label}
                      {s.link.prefilled && <span className="prefilled">pre-filled</span>}
                      <ExternalIcon />
                    </a>
                  )}
                  {wait && !s.link && <p className="why">You have nothing to do. Wait for the provider to reply. Then do the next step.</p>}
                  {(s.technical || stepPoints(s.plain).rest) && <TechDetails text={[stepPoints(s.plain).rest, s.technical].filter(Boolean).join(" ")} label="More detail" />}
                  <EvidenceBadge evidence={s.evidence} />
                  <div className="st-nav">
                    {i > 0 ? <button type="button" onClick={() => go(i - 1)}>← {steps[i - 1].title}</button> : <span />}
                    {i < steps.length - 1 && <button type="button" className="next" onClick={() => go(i + 1)}>Next: {steps[i + 1].title} →</button>}
                  </div>
                </div>
              )}
              {wait && waitTip && <div className="st-tip">{waitTip}</div>}
            </li>
          );
        })}
      </ol>
    </>
  );
}
