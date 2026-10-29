import type { Check, Checks, Evidence } from "@/lib/guide-schema";

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

// Everything the agent checked, as one mark beside the guide's title.
export function GuideCheck({ checks }: { checks?: Checks | null }) {
  if (!checks) return null;
  const endpoint = checks.discovery?.outcome === "differs" ? checks.discovery : (checks.authorize ?? checks.discovery);
  const all = [...checks.links, ...(endpoint ? [endpoint] : [])];
  if (!all.length || all.every((c) => c.outcome === "inconclusive")) return null;
  const n = (o: Check["outcome"]) => checks.links.filter((l) => l.outcome === o).length;
  const links = [
    n("ok") && `${n("ok")} load`,
    n("sign_in") && `${n("sign_in")} load behind a sign-in`,
    n("broken") && `${n("broken")} not found`,
    n("inconclusive") && `${n("inconclusive")} unclear`,
  ].filter(Boolean).join(", ");
  const detail = [
    checks.links.length > 0 && `${checks.links.length} step links: ${links}.`,
    endpoint && endpoint.outcome !== "inconclusive" && `Sign-in endpoint: ${endpoint.detail}`,
  ].filter(Boolean).join(" ");
  const outcome = all.some((c) => c.outcome === "broken" || c.outcome === "differs") ? "broken" : "ok";
  return <CheckMark check={{ kind: "link", url: "", outcome, detail }} date={checks.date} label="Checked by the agent" />;
}
