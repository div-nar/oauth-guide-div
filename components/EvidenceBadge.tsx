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

// What code saw without an account, kept apart from the evidence tags so it never
// reads as "Tested by hand". The details open on hover or tap.
function SealIcon({ ok }: { ok: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2.5l2.2 1.6 2.7-.2.9 2.6 2.3 1.4-.6 2.6 1 2.5-2.1 1.7-.4 2.7-2.7.5-1.7 2.1L12 20.9l-2.6 1-1.7-2.1-2.7-.5-.4-2.7-2.1-1.7 1-2.5-.6-2.6 2.3-1.4.9-2.6 2.7.2z" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      {ok ? <path d="M8.3 12.3l2.5 2.5 4.9-5.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M12 7.8v5M12 16.2v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  );
}

export function CheckMark({ check, date, label }: { check: Check; date: string; label: string }) {
  const ok = check.outcome === "ok" || check.outcome === "sign_in";
  return (
    <button type="button" className={`check-badge ${ok ? "ok" : "bad"}`} aria-label={`${label}: ${check.detail}`}>
      <SealIcon ok={ok} />
      <span>{ok ? "Agent Certified" : "Check failed"}</span>
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
