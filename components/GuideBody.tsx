"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccessModal } from "@/components/AccessModal";
import { EndpointCheck, EvidenceBadge } from "@/components/EvidenceBadge";
import { AppLogo } from "@/components/AppLogo";
import { BlockedList, FaqList, WhoList } from "@/components/GuideExtras";
import { HandoffButtons } from "@/components/HandoffButtons";
import { GRADE_MEANING, GRADE_WORD, GradeMark } from "@/components/GradeMark";
import { StepScroller } from "@/components/StepScroller";
import { StepTable } from "@/components/StepTable";
import { formatHandsOn, formatWait } from "@/lib/format";
import type { Guide } from "@/lib/guide-schema";
import { combine, selectionQuery } from "@/lib/paths";
import { ViewToggle } from "@/components/ViewToggle";

// The two questions that decide the path: what access, and whether you already have an app.
export function GuideBody({ guide: g, initialIds, initialExisting = false, baseUrl }: { guide: Guide; initialIds: string[]; initialExisting?: boolean; baseUrl: string }) {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>(initialIds);
  const [existing, setExisting] = useState(initialExisting && !!g.existingApp);
  const [editing, setEditing] = useState(false);
  const u = combine(g, ids);
  const steps = u.steps;
  const parallelNote = u.ids.length > 1 && g.useCases.filter((x) => u.ids.includes(x.id) && x.waitDays.max > 0).length > 1;
  const ex = g.existingApp;
  const picked = g.useCases.filter((x) => u.ids.includes(x.id));

  const sel = { ids: u.ids, existing: existing && !!ex };
  const composioRuledOut = (g.composio?.limits ?? []).some(
    (l) => l.evidence.level === "sourced" && l.useCaseIds.some((id) => u.ids.includes(id)),
  );
  return (
    <>
      <HandoffButtons guide={g} baseUrl={baseUrl} sel={sel} steps={existing && ex ? ex.steps : steps} />

      <section className="picker" aria-label="Your situation">
        <div className="choice-bar">
          <span className="choice-text">
            {u.labels.length ? <><span className="muted">Access:</span> {u.labels.join(" + ")}</> : <span className="muted">No OAuth app needed. {g.app.name} uses an API key.</span>}
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
              <div className="verdict-word">{GRADE_WORD[u.difficulty]}<EndpointCheck checks={g.checks} /></div>
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
          {!existing && picked.length > 1 ? (
            // Several kinds of access: one short row each, so the verdicts don't run together.
            <ul className="verdict-paths">
              {picked.map((x) => (
                <li key={x.id}>
                  <GradeMark difficulty={x.difficulty} size={12} />
                  <p className="verdict-path-label">{x.label} <span>{GRADE_WORD[x.difficulty]}</span></p>
                  <p className="verdict-path-summary">{x.summary}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="verdict-summary">{existing && ex ? ex.summary : u.summary}</p>
          )}
          {!g.oauth.supported && g.oauth.notes && (
            <details className="verdict-more">
              <summary>Why there is no OAuth app</summary>
              <p className="small muted">{g.oauth.notes}</p>
            </details>
          )}
          {parallelNote && !existing && (
            <p className="small muted">Waiting shows the longest single review, assuming separate reviews can run at the same time. We have not confirmed that for every provider.</p>
          )}
          {u.scopes.length > 0 && (
            <p className="small muted">Permissions: {u.scopes.map((s) => <code key={s}>{s}</code>)}</p>
          )}
        </div>

        {g.composio?.managedApp === "yes" && u.waitDays.max > 0 && !existing && !composioRuledOut && (
          <a className="btn secondary composio-btn" href={`https://docs.composio.dev/toolkits/${g.slug}`} target="_blank" rel="noreferrer" title={`Connect users today with Composio's own ${g.app.name} app, then switch to yours once it's approved.`}>
            <AppLogo name="Composio" website="composio.dev" size={16} />
            Can&apos;t wait? Connect on Composio
          </a>
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

      {/* People to line up before starting, so it comes before the steps. */}
      <WhoList guide={g} ids={u.ids} />
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
              <StepTable steps={ex.steps} checks={g.checks} />
            </>
          )}
        </section>
      ) : (
        <>
          <section className="block">
            <h2 className="label">Steps</h2>
            <StepScroller steps={steps} checks={g.checks} />
          </section>
        </>
      )}
      <BlockedList guide={g} ids={u.ids} />
      <FaqList guide={g} ids={u.ids} />
      <ViewToggle human={`/guides/${g.slug}${selectionQuery(sel)}`} machine={`/guides/${g.slug}/ai${selectionQuery(sel)}`} current="human" />
    </>
  );
}
