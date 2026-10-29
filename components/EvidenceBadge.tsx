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
// A small mark that sits on the card; what was seen opens on hover or tap.
const MARK = { ok: "✓", sign_in: "✓", broken: "!", differs: "!", inconclusive: "?" } as const;

export function CheckMark({ check, date, label }: { check: Check; date: string; label: string }) {
  return (
    <button type="button" className={`check-mark ${check.outcome}`} aria-label={`${label}: ${check.detail}`}>
      <span aria-hidden>{MARK[check.outcome]}</span>
      <span className="check-tip" role="tooltip">
        <strong>{label}</strong> {date}, without an account: {check.detail}
      </span>
    </button>
  );
}

export function StepCheck({ step, checks }: { step: Step; checks?: Checks | null }) {
  const c = checks && linkCheck(checks, step.link?.url);
  return c && checks ? <CheckMark check={c} date={checks.date} label="Link checked by the agent" /> : null;
}

// The sign-in endpoint check, or the published configuration check when that disagrees.
export function EndpointCheck({ checks }: { checks?: Checks | null }) {
  const c = checks?.discovery?.outcome === "differs" ? checks.discovery : (checks?.authorize ?? checks?.discovery);
  if (!c || !checks || c.outcome === "inconclusive") return null;
  return <CheckMark check={c} date={checks.date} label="Sign-in endpoint checked by the agent" />;
}
