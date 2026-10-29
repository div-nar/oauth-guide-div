"use client";

import { useEffect, useRef, useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { GRADE_WORD, GradeMark } from "@/components/GradeMark";
import type { Difficulty } from "@/lib/guide-schema";

export type AccessOption = { id: string; label: string; difficulty: Difficulty };

// Grows out of the button that opened it, and shrinks back into it on the way out.
// Reduced motion gets a short fade only.
function animateDialog(d: HTMLDialogElement, from: HTMLElement | null, dir: "in" | "out"): Promise<unknown> {
  if (typeof d.animate !== "function") return Promise.resolve();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = d.getBoundingClientRect();
  const src = from?.getBoundingClientRect();
  if (src) d.style.transformOrigin = `${src.left + src.width / 2 - box.left}px ${src.top + src.height / 2 - box.top}px`;
  const shown = { opacity: 1, transform: "none" };
  const hidden = { opacity: 0, transform: reduce ? "none" : "scale(0.92)" };
  const frames = dir === "in" ? [hidden, shown] : [shown, hidden];
  const timing = { duration: reduce ? 150 : dir === "in" ? 240 : 180, easing: dir === "in" ? "cubic-bezier(0.2, 0.9, 0.25, 1)" : "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" as const };
  try {
    d.animate([{ opacity: dir === "in" ? 0 : 1 }, { opacity: dir === "in" ? 1 : 0 }], { ...timing, pseudoElement: "::backdrop" });
  } catch {}
  return d.animate(frames, timing).finished.catch(() => {});
}

export function AccessModal({
  app,
  options,
  hasExisting,
  initial,
  confirmLabel = "Open guide",
  onConfirm,
  onClose,
}: {
  app: { name: string; website: string; logoUrl?: string | null };
  options: AccessOption[];
  hasExisting: boolean;
  initial: { access: string[]; existing: boolean };
  confirmLabel?: string;
  onConfirm: (access: string[], existing: boolean) => void;
  onClose: () => void;
}) {
  const [access, setAccess] = useState<string[]>(initial.access);
  const allPicked = options.every((o) => access.includes(o.id));
  // Multi-select, but never empty: unticking the last option is ignored.
  const toggle = (id: string) =>
    setAccess((a) => (a.includes(id) ? (a.length > 1 ? a.filter((x) => x !== id) : a) : [...a, id]));
  const [existing, setExisting] = useState(initial.existing);
  const ref = useRef<HTMLDialogElement>(null);

  // Only explicit user actions (Escape, backdrop, close button) call onClose. The
  // dialog's own "close" event also fires when React unmounts it (twice in dev),
  // which must not count as the user dismissing it.
  const trigger = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  useEffect(() => {
    const d = ref.current;
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (d && !d.open) {
      d.showModal();
      animateDialog(d, trigger.current, "in");
    }
    return () => {
      if (d?.open) d.close();
      // Back to where the person was, so the keyboard flow continues.
      trigger.current?.focus({ preventScroll: true });
    };
  }, []);

  // Leave along the same path it arrived: shrink back towards the button, then unmount.
  const dismiss = (then: () => void) => {
    const d = ref.current;
    if (!d || closing.current) return;
    closing.current = true;
    animateDialog(d, trigger.current, "out").finally(then);
  };

  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        dismiss(onClose);
      }}
      onClick={(e) => {
        if (e.target === ref.current) dismiss(onClose);
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-body">
        <header className="modal-head">
          <AppLogo name={app.name} website={app.website} logoUrl={app.logoUrl} size={28} />
          <h2 id="modal-title">{app.name}</h2>
          <button type="button" className="modal-x" aria-label="Close" onClick={() => dismiss(onClose)}>×</button>
        </header>

        <h3 className="picker-q">
          What access do you need? <span className="hint">Select all that apply</span>
          {options.length > 1 && (
            <button type="button" className="select-all" onClick={() => setAccess(allPicked ? [options[0].id] : options.map((o) => o.id))}>
              {allPicked ? "Clear" : "Select all"}
            </button>
          )}
        </h3>
        <div className="modal-options" role="group">
          {options.map((o) => (
            <button key={o.id} type="button" role="checkbox" aria-checked={access.includes(o.id)} className="modal-option" onClick={() => toggle(o.id)}>
              <span className="tick" aria-hidden>{access.includes(o.id) ? "✓" : ""}</span>
              <GradeMark difficulty={o.difficulty} size={12} />
              <span className="modal-option-label">{o.label}</span>
              <span className="modal-option-grade">{GRADE_WORD[o.difficulty]}</span>
            </button>
          ))}
        </div>

        {hasExisting && (
          <>
            <h3 className="picker-q second">Do you already have a {app.name} OAuth app?</h3>
            <div className="seg" role="radiogroup">
              {[false, true].map((v) => (
                <button key={String(v)} type="button" role="radio" aria-checked={existing === v} onClick={() => setExisting(v)}>
                  {v ? "Yes, reuse it" : "No, make a new app"}
                </button>
              ))}
            </div>
          </>
        )}

        <button type="button" className="btn modal-go" onClick={() => dismiss(() => onConfirm(access, existing))}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
