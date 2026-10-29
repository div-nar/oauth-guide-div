import { AskBox } from "@/components/AskBox";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import type { Guide } from "@/lib/guide-schema";
import { appliesTo } from "@/lib/paths";

const GLOSSARY: [string, string][] = [
  ["OAuth app", "Your app's registration with the provider. It sets the name users see on the 'Allow?' screen and what you may ask for."],
  ["Client ID and secret", "Your app's username and password. The ID is public. Keep the secret private, in your app's secret store, and add it there yourself."],
  ["Redirect address (redirect URI)", "Where the provider sends people after they click Allow: a callback address in your own app, which must match what you register with the provider."],
  ["Scopes", "The specific permissions you ask for, such as 'read email'. More powerful scopes mean more review."],
];

// "A Super Admin in each account" reads better as a list item without the article.
function roleName(role: string): string {
  const r = role.replace(/^(a|an|the)\s+/i, "");
  return r.charAt(0).toUpperCase() + r.slice(1);
}

// People and questions that apply to the selected access (all of them when ids is null).
export function WhoList({ guide: g, ids }: { guide: Guide; ids: string[] | null }) {
  const who = g.whoYouNeed.filter((w) => !ids || appliesTo(w.useCaseIds, ids));
  if (!who.length) return null;
  return (
    <section className="block">
      <h2 className="label">What you&apos;ll need</h2>
      <ul className="need-list">
        {who.map((w) => (
          <li key={w.role}>
            <svg className="need-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
            </svg>
            <p className="need-role">{roleName(w.role)}</p>
            <p className="need-why">{w.why}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Where it failed, then the fix; the cause shows on hover.
export function BlockedList({ guide: g, ids }: { guide: Guide; ids: string[] | null }) {
  const blockers = (g.blockers ?? []).filter((b) => !ids || appliesTo(b.useCaseIds, ids));
  if (!blockers.length) return null;
  return (
    <section className="block">
      <h2 className="label">Blocked or rejected?</h2>
      <ul className="blockers">
        {blockers.map((b) => (
          <li key={b.symptom} className="blocker" title={`Why: ${b.cause}`}>
            <span className="blocker-icon" aria-hidden>!</span>
            <p className="blocker-where">{b.symptom.replace(/\.$/, "")}</p>
            <p className="blocker-fix">
              {b.fix}
              {b.escalate && (
                <> <a href={b.escalate.url} target="_blank" rel="noreferrer" title={b.escalate.label}>Help<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M9.5 2.5h4v4M13.5 2.5 7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></a></>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chevron() {
  return (
    <svg className="faq-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// This app's what-ifs and gotchas open one at a time; the OAuth terms are short, so
// they sit open as a small glossary.
export function FaqList({ guide: g, ids }: { guide: Guide; ids: string[] | null }) {
  const keep = (x: { useCaseIds?: string[] | null }) => !ids || appliesTo(x.useCaseIds, ids);
  const faqs = [
    ...g.forks.filter(keep).map((f) => ({ q: `What if ${f.condition.charAt(0).toLowerCase() + f.condition.slice(1)}?`, a: f.effect, stuck: null as string | null, evidence: f.evidence })),
    ...g.nuances.filter(keep).map((n) => ({ q: n.title, a: n.detail, stuck: n.ifStuck, evidence: n.evidence })),
  ];
  return (
    <section className="block">
      <h2 className="label">Questions</h2>
      {faqs.length > 0 && (
        <>
          <h3 className="faq-group">{g.app.name}</h3>
          <div className="faq">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}<Chevron /></summary>
                <div className="faq-body">
                  <p>{f.a}</p>
                  {f.stuck && <p className="faq-stuck"><span>If you&apos;re stuck</span>{f.stuck}</p>}
                  {f.evidence && <EvidenceBadge evidence={f.evidence} />}
                </div>
              </details>
            ))}
          </div>
        </>
      )}
      <AskBox slug={g.slug} appName={g.app.name} access={ids} />
      <h3 className="faq-group">OAuth basics</h3>
      <dl className="glossary">
        {GLOSSARY.map(([term, def]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{def}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
