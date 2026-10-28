"use client";

import { useEffect, useRef, useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { GRADE_WORD, GradeMark } from "@/components/GradeMark";
import type { Difficulty } from "@/lib/guide-schema";

export type AccessOption = { id: string; label: string; difficulty: Difficulty };

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
  initial: { access: string; existing: boolean };
  confirmLabel?: string;
  onConfirm: (access: string, existing: boolean) => void;
  onClose: () => void;
}) {
  const [access, setAccess] = useState(initial.access);
  const [existing, setExisting] = useState(initial.existing);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-body">
        <header className="modal-head">
          <AppLogo name={app.name} website={app.website} logoUrl={app.logoUrl} size={28} />
          <h2 id="modal-title">{app.name}</h2>
          <button type="button" className="modal-x" aria-label="Close" onClick={onClose}>×</button>
        </header>

        <h3 className="picker-q">What access do you need?</h3>
        <div className="modal-options" role="radiogroup">
          {options.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={access === o.id} className="modal-option" onClick={() => setAccess(o.id)}>
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
                  {v ? "Yes, reuse it" : "No, starting fresh"}
                </button>
              ))}
            </div>
          </>
        )}

        <button type="button" className="btn modal-go" onClick={() => onConfirm(access, existing)}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
