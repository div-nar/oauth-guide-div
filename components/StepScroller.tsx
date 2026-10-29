"use client";

import { useEffect, useRef, useState } from "react";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { PathLegend, PathVisual } from "@/components/PathVisual";
import type { Step } from "@/lib/guide-schema";
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

// Critically damped spring (Apple's default: damping 1, response ~0.38s). Starts from
// wherever the card is and whatever speed it has, so any move can interrupt another.
const OMEGA = (2 * Math.PI) / 0.38;
// Where a flick would come to rest (Apple's projection, scroll-like deceleration).
const project = (v: number, rate = 0.998) => ((v / 1000) * rate) / (1 - rate);
// Past the first or last step the card resists more the further it is pulled.
const rubberband = (x: number, size: number, c = 0.55) => (x * size * c) / (size + c * Math.abs(x));

// The path strip doubles as a progress bar above one step card. Drag or flick the card,
// scroll over it, or use the arrow keys, the arrow buttons or the dots.
export function StepScroller({ steps }: { steps: Step[] }) {
  const n = steps.length;
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLElement>(null);
  const onScreen = useRef(false);
  const activeNow = useRef(0);
  useEffect(() => { activeNow.current = active; }, [active]);

  // The card's live offset and speed, written straight to the DOM every frame.
  const pos = useRef({ x: 0, v: 0, raf: 0 });
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const paint = (x: number) => {
    const el = card.current;
    if (!el) return;
    pos.current.x = x;
    el.style.transform = x ? `translate3d(${x}px, 0, 0)` : "";
    el.style.opacity = x ? String(1 - Math.min(Math.abs(x) / (el.offsetWidth || 1), 1) * 0.5) : "";
  };
  const settle = (v0: number) => {
    cancelAnimationFrame(pos.current.raf);
    if (reduce()) { pos.current.v = 0; paint(0); return; }
    const x0 = pos.current.x;
    const b = v0 + OMEGA * x0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      const e = Math.exp(-OMEGA * t);
      const x = (x0 + b * t) * e;
      const v = (b - OMEGA * (x0 + b * t)) * e;
      pos.current.v = v;
      if (Math.abs(x) < 0.5 && Math.abs(v) < 5) { pos.current.v = 0; paint(0); return; }
      paint(x);
      pos.current.raf = requestAnimationFrame(frame);
    };
    pos.current.raf = requestAnimationFrame(frame);
  };

  // Every way of moving lands here. The new step's card enters from the side it is
  // coming from, carrying the gesture's speed (0 for clicks and keys).
  const go = (i: number, v0 = 0, fromDrag = false) => {
    const from = activeNow.current;
    const k = Math.max(0, Math.min(n - 1, i));
    if (k === from) { settle(v0); return; }
    const dir = k > from ? 1 : -1;
    const w = card.current?.offsetWidth ?? 600;
    const carry = Math.sign(pos.current.x) === dir ? pos.current.x : 0;
    paint(fromDrag ? dir * Math.min(w * 0.3, 140) : Math.max(-140, Math.min(140, carry + dir * 56)));
    activeNow.current = k;
    setActive(k);
    settle(v0);
  };
  const goRef = useRef(go);
  useEffect(() => { goRef.current = go; });
  useEffect(() => () => cancelAnimationFrame(pos.current.raf), []);

  // Drag with a finger or pen: the card tracks 1:1 once the move is clearly sideways;
  // vertical moves are left to the page (touch-action: pan-y).
  const drag = useRef<{ id: number; x0: number; y0: number; base: number; on: boolean; moved: boolean; hist: { x: number; t: number }[] } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    cancelAnimationFrame(pos.current.raf); // grab it mid-flight
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, base: pos.current.x, on: false, moved: false, hist: [{ x: e.clientX, t: e.timeStamp }] };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag.current = null; settle(0); return; }
      if (Math.abs(dx) < 10) return;
      d.on = d.moved = true;
      card.current?.setPointerCapture(e.pointerId);
    }
    d.hist.push({ x: e.clientX, t: e.timeStamp });
    d.hist = d.hist.filter((h) => e.timeStamp - h.t < 100);
    if (reduce()) return;
    let x = d.base + dx;
    const i = activeNow.current;
    if ((x > 0 && i === 0) || (x < 0 && i === n - 1)) x = rubberband(x, card.current?.offsetWidth ?? 600);
    paint(x);
  };
  const justDragged = useRef(false);
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    if (d.moved) {
      justDragged.current = true;
      setTimeout(() => { justDragged.current = false; }, 0);
    }
    if (!d.on) { settle(0); return; }
    const first = d.hist[0];
    const last = d.hist[d.hist.length - 1];
    const v = last.t > first.t ? ((last.x - first.x) / (last.t - first.t)) * 1000 : 0;
    const w = card.current?.offsetWidth ?? 600;
    const end = (reduce() ? e.clientX - d.x0 : pos.current.x) + project(v);
    const i = activeNow.current;
    if (end < -w * 0.35 && i < n - 1) go(i + 1, v, true);
    else if (end > w * 0.35 && i > 0) go(i - 1, v, true);
    else settle(v);
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
      if (e.key === "ArrowRight") { e.preventDefault(); goRef.current(activeNow.current + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goRef.current(activeNow.current - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => { io.disconnect(); window.removeEventListener("keydown", onKey); };
  }, [n]);

  // Scrolling or swiping over the steps moves between them. At the first or last
  // step the page scrolls on as usual, so nobody gets stuck. One move per gesture:
  // a trackpad keeps sending scroll events for a moment after a swipe.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let acc = 0;
    let lockedUntil = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch zoom
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const step = d > 0 ? 1 : -1;
      const next = activeNow.current + step;
      if (next < 0 || next > n - 1) { acc = 0; return; }
      e.preventDefault();
      if (performance.now() < lockedUntil) return;
      acc += d;
      if (Math.abs(acc) < 40) return;
      acc = 0;
      lockedUntil = performance.now() + 450;
      goRef.current(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [n]);

  // The address names the open step once someone moves, so it can be shared. Not on
  // first load: writing #step-<first> there made the page jump down to the steps.
  const shown = useRef(active);
  useEffect(() => {
    if (active === shown.current) return;
    shown.current = active;
    if (steps[active]) history.replaceState(null, "", `#step-${steps[active].id}`);
    // Only when the step changes: the array is rebuilt on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Open the step named in the address (#step-<id>), as agents' permalinks do. Keyed on
  // the step ids, not the array: updating the address re-renders the page with a new
  // array, and re-running this would scroll the page back to the steps.
  const ids = steps.map((s) => s.id).join(" ");
  useEffect(() => {
    const list = ids.split(" ");
    const fromHash = () => {
      const i = list.findIndex((id) => `#step-${id}` === window.location.hash);
      if (i >= 0) {
        setActive(i);
        root.current?.scrollIntoView({ block: "start" });
      }
    };
    const frame = requestAnimationFrame(fromHash);
    window.addEventListener("hashchange", fromHash);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", fromHash); };
  }, [ids]);

  const s = steps[active] ?? steps[0];
  if (!s) return null;

  return (
    <div
      ref={root}
      className="step-viewer"
    >
      {steps.map((x) => <span key={x.id} id={`step-${x.id}`} className="step-anchor" aria-hidden />)}
      <PathVisual steps={steps} active={active} onSelect={(i) => go(i)} legend={false} />
      <article
        ref={card}
        className={`step-card ${s.owner}`}
        aria-live="polite"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          // A drag that started on a link or button must not also click it.
          if (justDragged.current) { e.preventDefault(); e.stopPropagation(); }
        }}
      >
        <header className="step-card-head">
          <span className="owner-chip">{OWNER[s.owner]}</span>
          <span className="step-card-count">{active + 1} / {n}{timeOf(s) && <span className="step-card-time">, {timeOf(s)}</span>}</span>
          <span className="step-arrows">
            <button type="button" onClick={() => go(activeNow.current - 1)} disabled={active === 0} aria-label="Previous step" title="Previous step (←)"><Arrow left /></button>
            <button type="button" onClick={() => go(activeNow.current + 1)} disabled={active === n - 1} aria-label="Next step" title="Next step (→)"><Arrow /></button>
          </span>
        </header>
        <h3 className="step-card-title">{s.title}</h3>
        <p>{s.plain}</p>
        {s.whyHuman && <p className="why">{s.whyHuman}</p>}
        {s.link && (
          <a className="step-cta" href={s.link.url} target="_blank" rel="noreferrer">
            {s.link.label}
            {s.link.prefilled && <span className="prefilled">pre-filled</span>}
            <ExternalIcon />
          </a>
        )}
        {s.owner === "waiting" && !s.link && <p className="why">Nothing to do but wait. The next step starts when the provider replies.</p>}
        {s.technical && <p className="tech-text">{s.technical}</p>}
        <EvidenceBadge evidence={s.evidence} />
      </article>
      <div className="step-foot">
        <PathLegend steps={steps} />
        <p className="step-hint">Scroll over the steps, or use ← →</p>
      </div>
    </div>
  );
}
