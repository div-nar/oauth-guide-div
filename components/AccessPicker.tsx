"use client";

import { useState } from "react";
import { GRADE_MEANING, GRADE_WORD, GradeMark } from "@/components/GradeMark";
import { formatHandsOn, formatWait } from "@/lib/format";
import type { UseCase } from "@/lib/guide-schema";

export function AccessPicker({ useCases, defaultId, appName }: { useCases: UseCase[]; defaultId: string; appName: string }) {
  const [id, setId] = useState(defaultId);
  const u = useCases.find((x) => x.id === id) ?? useCases[0];
  return (
    <section className="picker" aria-label="Difficulty by access">
      <h2 className="picker-q">What access do you need?</h2>
      <div className="picker-options" role="radiogroup">
        {useCases.map((x) => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={x.id === u.id}
            className="picker-option"
            onClick={() => setId(x.id)}
          >
            <GradeMark difficulty={x.difficulty} size={14} />
            {x.label}
          </button>
        ))}
      </div>
      <div className="verdict-card" aria-live="polite">
        <div className="verdict-grade">
          <GradeMark difficulty={u.difficulty} size={44} />
          <div>
            <div className="verdict-word">{GRADE_WORD[u.difficulty]}</div>
            <div className="small muted">{GRADE_MEANING[u.difficulty]}</div>
          </div>
        </div>
        <dl className="verdict-facts">
          <div><dt>Your time</dt><dd>{formatHandsOn(u.handsOnMinutes)}</dd></div>
          <div><dt>Waiting on {appName}</dt><dd>{formatWait(u.waitDays)}</dd></div>
        </dl>
        <p className="verdict-summary">{u.summary}</p>
        {u.scopes.length > 0 && (
          <p className="small muted">
            Permissions: {u.scopes.map((s) => <code key={s}>{s}</code>)}
          </p>
        )}
      </div>
    </section>
  );
}
