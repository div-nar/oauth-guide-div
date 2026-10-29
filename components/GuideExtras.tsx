import { AskBox } from "@/components/AskBox";
import type { Guide } from "@/lib/guide-schema";
import { appliesTo } from "@/lib/paths";

// The general OAuth questions every guide answers the same way.
const BASICS: [string, string][] = [
  ["What is an OAuth app?", "It is the record of your app at the provider. It sets the name that users see on the 'Allow?' screen. It also sets the permissions that you can ask for."],
  ["What are the client ID and secret?", "They are the username and password of your app. The ID is public. Keep the secret private in the secret store of your app. Add it there yourself."],
  ["What is a callback address (redirect URI)?", "It is the address in your app where the provider sends users after they click Allow. It must be the same as the address that you register with the provider."],
  ["What are scopes?", "They are the permissions that you ask for, for example 'read email'. Stronger scopes need more review."],
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
            <p className="blocker-where">
              <span>{b.symptom.replace(/\.$/, "")}</span>
              {b.escalate && (
                <a href={b.escalate.url} target="_blank" rel="noreferrer" title={b.escalate.label}>Help<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M9.5 2.5h4v4M13.5 2.5 7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
              )}
            </p>
            <p className="blocker-fix">{b.fix}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// The ask box, answered from this guide; this app's what-ifs are its starter questions.
export function FaqList({ guide: g, ids }: { guide: Guide; ids: string[] | null }) {
  const keep = (x: { useCaseIds?: string[] | null }) => !ids || appliesTo(x.useCaseIds, ids);
  const starters = g.forks.filter(keep).slice(0, 3).map((f) => `What if ${f.condition.charAt(0).toLowerCase() + f.condition.slice(1)}?`);
  return (
    <section className="block">
      <h2 className="label">Questions</h2>
      <AskBox slug={g.slug} appName={g.app.name} access={ids} starters={starters} />
    </section>
  );
}

// The general OAuth terms, the same for every app.
export function OAuthBasics() {
  return (
    <section className="block">
      <h2 className="label">OAuth basics</h2>
      <dl className="glossary">
        {BASICS.map(([q, a]) => (
          <div key={q}>
            <dt>{q}</dt>
            <dd>{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
