"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { BlockedList, FaqList, PitfallList, ProtocolList, WhoList } from "@/components/GuideExtras";
import { GRADE_WORD, GradeMark } from "@/components/GradeMark";
import { HandoffButtons } from "@/components/HandoffButtons";
import { StepTable } from "@/components/StepTable";
import { StepTimeline } from "@/components/StepTimeline";
import { ViewToggle } from "@/components/ViewToggle";
import { formatHandsOn, formatWait } from "@/lib/format";
import type { Guide } from "@/lib/guide-schema";
import { combine, selectionQuery } from "@/lib/paths";

// Gated access with no time and no wait is closed, not instant (LinkedIn r_member_social).
const closed = (x: { difficulty: string; handsOnMinutes: { max: number }; waitDays: { max: number } }) =>
  x.difficulty === "gated" && x.handsOnMinutes.max === 0 && x.waitDays.max === 0;

// The first sentence of the verdict in bold, the rest after it.
function Lede({ text }: { text: string }) {
  const m = text.match(/^([^]+?[.!?])\s+([^]*)$/);
  return <p className="guide-lede">{m ? <><b>{m[1]}</b> {m[2]}</> : <b>{text}</b>}</p>;
}

// One page, top to bottom: the verdict, the hand-off, what access you need (a table you
// pick from, no pop-up), what to have ready, the steps, pitfalls and fixes, the protocol,
// then questions.
export function GuideBody({ guide: g, initialIds, initialExisting = false, baseUrl }: { guide: Guide; initialIds: string[]; initialExisting?: boolean; baseUrl: string }) {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>(initialIds);
  const ex = g.existingApp;
  const [existing, setExisting] = useState(initialExisting && !!ex);
  // No row ticked means the whole guide: every step, nothing narrowed.
  const all = g.useCases.length > 0 && ids.length === 0;
  const u = all ? { ...combine(g, []), ids: [] as string[], steps: g.steps } : combine(g, ids);
  const sel = { ids: u.ids, existing: existing && !!ex };
  const scopeText = new Map(g.config.scopes.map((s) => [s.name, s.plain]));

  const update = (next: string[], nextExisting: boolean) => {
    setIds(next);
    setExisting(nextExisting);
    // An empty ?access= keeps "every step" when the page is reloaded or shared.
    const q = next.length || nextExisting ? selectionQuery({ ids: next, existing: nextExisting }) : "?access=";
    router.replace(`/guides/${g.slug}${q}`, { scroll: false });
  };
  const toggle = (id: string) => {
    const has = u.ids.includes(id);
    update(has ? u.ids.filter((x) => x !== id) : [...u.ids, id], existing);
  };

  // A tip under the review wait: Composio's own app when it has one, else an access with no review.
  const composioRuledOut = (g.composio?.limits ?? []).some((l) => l.evidence.level === "sourced" && l.useCaseIds.some((id) => u.ids.includes(id)));
  const noReview = g.useCases.find((x) => !u.ids.includes(x.id) && x.waitDays.max === 0);
  const waitTip =
    g.composio?.managedApp === "yes" && !composioRuledOut ? (
      <><b>Do you need access now?</b> Connect users today through the Composio {g.app.name} app. Change to your own app after it gets approval. <a href={`https://docs.composio.dev/toolkits/${g.slug}`} target="_blank" rel="noreferrer"><AppLogo name="Composio" website="composio.dev" size={12} /> Composio</a></>
    ) : noReview ? (
      <><b>Do you need access now?</b> &ldquo;{noReview.label}&rdquo; needs no review. Release it first.</>
    ) : null;

  const steps = existing && ex ? ex.steps : u.steps;
  return (
    <>
      <Lede text={existing && ex ? ex.summary : g.verdict.summary} />
      <HandoffButtons guide={g} baseUrl={baseUrl} sel={sel} steps={steps} />

      {g.useCases.length > 0 ? (
        <section className="block">
          <h2 className="label">What will your agent do in {g.app.name}?</h2>
          <table className="access-table">
            <thead>
              <tr><th>Access</th><th>Difficulty</th><th>Your time</th><th>Wait</th></tr>
            </thead>
            <tbody>
              {g.useCases.map((x) => {
                const on = u.ids.includes(x.id);
                return (
                  <tr key={x.id} className={on ? "sel" : undefined} onClick={() => toggle(x.id)}>
                    <td>
                      <button type="button" role="checkbox" aria-checked={on} className="access-pick" onClick={(e) => { e.stopPropagation(); toggle(x.id); }}>
                        <span className="tick" aria-hidden />
                        {x.label}
                      </button>
                      {on && x.scopes.length > 0 && (
                        <>
                          {x.scopes.some((s) => scopeText.get(s)) && (
                            <dl className="scope-list">
                              {x.scopes.filter((s) => scopeText.get(s)).map((s) => (
                                <div key={s}><dt><code>{s}</code></dt><dd>{scopeText.get(s)}</dd></div>
                              ))}
                            </dl>
                          )}
                          {x.scopes.some((s) => !scopeText.get(s)) && (
                            <p className="scope-chips">{x.scopes.filter((s) => !scopeText.get(s)).map((s) => <code key={s}>{s}</code>)}</p>
                          )}
                        </>
                      )}
                    </td>
                    <td><span className={`grade-chip ${x.difficulty}`}><GradeMark difficulty={x.difficulty} size={10} /> {GRADE_WORD[x.difficulty]}</span></td>
                    {closed(x) ? (
                      <td className="num" colSpan={2}>Not available to new apps</td>
                    ) : (
                      <>
                        <td className="num">{formatHandsOn(x.handsOnMinutes)}</td>
                        <td className="num">{formatWait(x.waitDays)}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="access-under">
            {all ? "No row is selected, so the guide shows every step. Select a row to see only its steps. " : g.useCases.length > 1 && "Select more than one row to combine them. "}
            {ex && (
              <button type="button" className="link-btn" onClick={() => update(u.ids, !existing)}>
                {existing ? "Show the setup for a new app" : `Do you already have a ${g.app.name} app?`}
              </button>
            )}
          </p>
          {!all && u.ids.length > 1 && (
            <p className="access-total">For your selection: {formatHandsOn(u.handsOnMinutes)} of your time, {formatWait(u.waitDays)} of waiting.</p>
          )}
        </section>
      ) : g.oauth.supported ? null : (
        <section className="block">
          <p className="no-oauth"><b>No OAuth app is necessary.</b> {g.app.name} uses an API key.</p>
          {g.oauth.notes && (
            <details className="verdict-more">
              <summary>Why there is no OAuth app</summary>
              <p className="small muted">{g.oauth.notes}</p>
            </details>
          )}
        </section>
      )}

      <WhoList guide={g} ids={u.ids} />

      {existing && ex ? (
        <section className="block">
          <h2 className="label">What can send you back to review</h2>
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
        <section className="block">
          <h2 className="label">Steps</h2>
          <StepTimeline steps={u.steps} waitTip={waitTip} />
        </section>
      )}

      <div className="two-col">
        <PitfallList guide={g} ids={u.ids} />
        <BlockedList guide={g} ids={u.ids} />
      </div>
      <ProtocolList guide={g} />
      <FaqList guide={g} ids={u.ids} />
      <ViewToggle human={`/guides/${g.slug}${selectionQuery(sel)}`} machine={`/guides/${g.slug}/ai${selectionQuery(sel)}`} current="human" />
    </>
  );
}
