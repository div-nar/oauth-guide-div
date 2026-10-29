import type { Check, Checks, Evidence, Step } from "@/lib/guide-schema";
import { linkCheck } from "@/lib/render-markdown";

const WORD = { tested: "Tested by hand", sourced: "Source", uncertain: "Unconfirmed" } as const;

export function EvidenceBadge({ evidence }: { evidence: Evidence }) {
  return (
    <div className={`ev ${evidence.level}`}>
      <span className="tag">{WORD[evidence.level]}</span>
      {evidence.sources.length > 0 && (
        <span>
          {evidence.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
            </span>
          ))}
        </span>
      )}
      {evidence.note && <span className="note">{evidence.note}</span>}
    </div>
  );
}

// What code saw when it opened a link, without an account. Kept apart from the
// evidence tag so it never reads as "Tested by hand".
export function CheckLine({ check, date }: { check: Check; date: string }) {
  return (
    <div className={`ev check ${check.outcome}`}>
      <span className="tag">Checked by the agent</span>
      <span>{date}: {check.detail}</span>
    </div>
  );
}

export function StepCheck({ step, checks }: { step: Step; checks?: Checks | null }) {
  const c = checks && linkCheck(checks, step.link?.url);
  return c && checks ? <CheckLine check={c} date={checks.date} /> : null;
}
