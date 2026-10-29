import { AskBox } from "@/components/AskBox";
import type { Guide } from "@/lib/guide-schema";
import { appliesTo } from "@/lib/paths";

// The general OAuth questions every guide answers the same way.
const BASICS: [string, string][] = [
  ["What is an OAuth app?", "Your app's registration with the provider. It sets the name users see on the 'Allow?' screen and what you may ask for."],
  ["What are the client ID and secret?", "Your app's username and password. The ID is public. Keep the secret private, in your app's secret store, and add it there yourself."],
  ["What is a redirect address (redirect URI)?", "Where the provider sends people after they click Allow: a callback address in your own app, which must match what you register with the provider."],
  ["What are scopes?", "The specific permissions you ask for, such as 'read email'. More powerful scopes mean more review."],
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

function Chevron() {
  return (
    <svg className="faq-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Questions every developer asks, whatever the app. Answers hold for any provider;
// app-specific detail comes from the ask box above them.
const GENERAL: [string, string][] = [
  ["Can my agent create the app for me?", "Partly. Steps tagged Agent can be done in your signed-in browser or terminal. Signing in, accepting terms, verifying a domain and handling the client secret stay with you, and the agent stops and asks at each of those."],
  ["Should I use one OAuth app for development and production?", "Most teams use two: one for local testing with a localhost callback, and one for production with an HTTPS callback. It keeps test users and real users apart, and a review only needs the production app."],
  ["What if I need more permissions later?", "You can add scopes later, but people who already connected must approve again, and providers that review apps usually review the new scopes too. Ask for what you need now and plan larger changes ahead."],
  ["Where should the client secret live?", "In your app's secret store or environment variables on the server, never in front-end code, a repository or a chat. If it leaks, rotate it in the provider's dashboard."],
];

// The ask box first (answered from this guide; this app's what-ifs are its starter
// questions), then the general questions.
export function FaqList({ guide: g, ids }: { guide: Guide; ids: string[] | null }) {
  const keep = (x: { useCaseIds?: string[] | null }) => !ids || appliesTo(x.useCaseIds, ids);
  const starters = g.forks.filter(keep).slice(0, 3).map((f) => `What if ${f.condition.charAt(0).toLowerCase() + f.condition.slice(1)}?`);
  return (
    <section className="block">
      <h2 className="label">Questions</h2>
      <AskBox slug={g.slug} appName={g.app.name} access={ids} starters={starters} />
      <div className="faq faq-list">
        {GENERAL.map(([q, a]) => (
          <details key={q}>
            <summary>{q}<Chevron /></summary>
            <div className="faq-body"><p>{a}</p></div>
          </details>
        ))}
      </div>
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
