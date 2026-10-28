"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccessModal } from "@/components/AccessModal";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { GRADE_MEANING, GRADE_WORD, GradeMark } from "@/components/GradeMark";
import { PathVisual } from "@/components/PathVisual";
import { StepTable } from "@/components/StepTable";
import { formatHandsOn, formatWait } from "@/lib/format";
import type { Guide } from "@/lib/guide-schema";
import { combine } from "@/lib/paths";

// The two questions that decide the path: what access, and whether you already have an app.
export function GuideBody({ guide: g, initialIds, initialExisting = false }: { guide: Guide; initialIds: string[]; initialExisting?: boolean }) {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>(initialIds);
  const [existing, setExisting] = useState(initialExisting && !!g.existingApp);
  const [editing, setEditing] = useState(false);
  const u = combine(g, ids);
  const steps = u.steps;
  const parallelNote = u.ids.length > 1 && g.useCases.filter((x) => u.ids.includes(x.id) && x.waitDays.max > 0).length > 1;
  const ex = g.existingApp;

  return (
    <>
      <section className="picker" aria-label="Your situation">
        <div className="choice-bar">
          <span className="choice-text">
            <span className="muted">Access:</span> {u.labels.join(" + ")}
            {ex && <><span className="choice-sep" aria-hidden>/</span><span className="muted">{existing ? "Reusing your existing app" : "New app"}</span></>}
          </span>
          {(g.useCases.length > 1 || ex) && (
            <button type="button" className="change-btn" onClick={() => setEditing(true)}>Change</button>
          )}
        </div>
        <div className="verdict-card" aria-live="polite">
          <div className="verdict-grade">
            <GradeMark difficulty={u.difficulty} size={44} />
            <div>
              <div className="verdict-word">{GRADE_WORD[u.difficulty]}</div>
              <div className="small muted">{GRADE_MEANING[u.difficulty]}</div>
            </div>
          </div>
          {!existing && (
            <dl className="verdict-facts">
              <div><dt>Your time</dt><dd>{formatHandsOn(u.handsOnMinutes)}</dd></div>
              <div><dt>Waiting on {g.app.name}{parallelNote ? " (longest)" : ""}</dt><dd>{formatWait(u.waitDays)}</dd></div>
              <div><dt>Steps</dt><dd>{steps.length}</dd></div>
            </dl>
          )}
          <p className="verdict-summary">{existing && ex ? ex.summary : u.summary}</p>
          {parallelNote && !existing && (
            <p className="small muted">Waiting shows the longest single review, assuming separate reviews can run at the same time. We have not confirmed that for every provider.</p>
          )}
          {u.scopes.length > 0 && (
            <p className="small muted">Permissions: {u.scopes.map((s) => <code key={s}>{s}</code>)}</p>
          )}
        </div>

        {g.composio?.managedApp === "yes" && u.waitDays.max > 0 && !existing && (
          <div className="managed-note">
            <strong>Can&apos;t wait {formatWait(u.waitDays)}?</strong> {g.composio.note}
            <EvidenceBadge evidence={g.composio.evidence} />
          </div>
        )}
      </section>

      {editing && (
        <AccessModal
          app={g.app}
          options={g.useCases.map((x) => ({ id: x.id, label: x.label, difficulty: x.difficulty }))}
          hasExisting={!!ex}
          initial={{ access: u.ids, existing }}
          confirmLabel="Update the guide"
          onClose={() => setEditing(false)}
          onConfirm={(access, isExisting) => {
            setIds(access);
            setExisting(isExisting);
            setEditing(false);
            router.replace(`/guides/${g.slug}?access=${access.join(",")}${isExisting ? "&existing=1" : ""}`, { scroll: false });
          }}
        />
      )}

      {existing && ex ? (
        <section className="block">
          <h2 className="label">What could send you back to review</h2>
          <ul className="who-list">
            {ex.reReviewTriggers.map((t) => (
              <li key={t.trigger}>
                <strong>{t.trigger}</strong>
                <span className="muted">{t.effect}<EvidenceBadge evidence={t.evidence} /></span>
              </li>
            ))}
          </ul>
          {ex.steps.length > 0 && (
            <>
              <h2 className="label" style={{ marginTop: 32 }}>Steps</h2>
              <StepTable steps={ex.steps} />
            </>
          )}
        </section>
      ) : (
        <>
          <section className="block">
            <h2 className="label">The path</h2>
            <PathVisual steps={steps} />
          </section>
          <section className="block">
            <h2 className="label">Steps</h2>
            <StepTable steps={steps} />
          </section>
        </>
      )}
    </>
  );
}
