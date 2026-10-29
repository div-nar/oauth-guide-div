import { CheckLine, EvidenceBadge } from "@/components/EvidenceBadge";
import type { Guide } from "@/lib/guide-schema";
import { appliesTo } from "@/lib/paths";

const GLOSSARY: [string, string][] = [
  ["What is an OAuth app?", "Your app's registration with the provider. It sets the name users see on the 'Allow?' screen and what you may ask for."],
  ["What are the client ID and secret?", "Your app's username and password. The ID is public. Keep the secret private, and paste it into Composio yourself."],
  ["What is a redirect address (redirect URI)?", "Where the provider sends people after they click Allow. With Composio, you copy it from your auth config."],
  ["What are scopes?", "The specific permissions you ask for, such as 'read email'. More powerful scopes mean more review."],
];

// People and questions that apply to the selected access (all of them when ids is null).
export function WhoList({ guide: g, ids }: { guide: Guide; ids: string[] | null }) {
  const who = g.whoYouNeed.filter((w) => !ids || appliesTo(w.useCaseIds, ids));
  if (!who.length) return null;
  return (
    <section className="block">
      <h2 className="label">Who you&apos;ll need</h2>
      <ul className="who-list">
        {who.map((w) => (
          <li key={w.role}><strong>{w.role}</strong><span className="muted">{w.why}</span></li>
        ))}
      </ul>
    </section>
  );
}

// Checks run by code without an account: they show the pages and the sign-in
// endpoint are live, not that the whole setup works.
export function CheckedList({ guide: g }: { guide: Guide }) {
  const c = g.checks;
  if (!c) return null;
  const n = (o: string) => c.links.filter((l) => l.outcome === o).length;
  const parts = [
    n("ok") && `${n("ok")} load`,
    n("sign_in") && `${n("sign_in")} load behind a sign-in`,
    n("broken") && `${n("broken")} not found`,
    n("inconclusive") && `${n("inconclusive")} gave no clear answer`,
  ].filter(Boolean);
  return (
    <section className="block">
      <h2 className="label">What the agent checked</h2>
      <p className="muted small">
        Without an account, so this shows the pages and the sign-in endpoint are live, not that the setup works end to end.
      </p>
      {c.links.length > 0 && (
        <CheckLine
          check={{ kind: "link", url: "", outcome: n("broken") ? "broken" : "ok", detail: `${c.links.length} step links: ${parts.join(", ")}` }}
          date={c.date}
        />
      )}
      {c.authorize && <CheckLine check={c.authorize} date={c.date} />}
      {c.discovery && <CheckLine check={c.discovery} date={c.date} />}
    </section>
  );
}

export function BlockedList({ guide: g, ids }: { guide: Guide; ids: string[] | null }) {
  const blockers = (g.blockers ?? []).filter((b) => !ids || appliesTo(b.useCaseIds, ids));
  if (!blockers.length) return null;
  return (
    <section className="block">
      <h2 className="label">Blocked or rejected?</h2>
      <div className="faq">
        {blockers.map((b) => (
          <details key={b.symptom}>
            <summary>{b.symptom}</summary>
            <div className="faq-body">
              <p><strong>Why:</strong> {b.cause}</p>
              <p><strong>What to do:</strong> {b.fix}</p>
              {b.escalate && (
                <p><strong>Where to go:</strong> <a className="escalate-link" href={b.escalate.url} target="_blank" rel="noreferrer">{b.escalate.label}</a></p>
              )}
              <EvidenceBadge evidence={b.evidence} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FaqList({ guide: g, ids }: { guide: Guide; ids: string[] | null }) {
  const keep = (x: { useCaseIds?: string[] | null }) => !ids || appliesTo(x.useCaseIds, ids);
  const faqs = [
    ...g.forks.filter(keep).map((f) => ({ q: `What if ${f.condition.charAt(0).toLowerCase() + f.condition.slice(1)}?`, a: f.effect, extra: null as string | null, evidence: f.evidence })),
    ...g.nuances.filter(keep).map((n) => ({ q: n.title, a: n.detail, extra: `If you're stuck: ${n.ifStuck}`, evidence: n.evidence })),
    ...GLOSSARY.map(([q, a]) => ({ q, a, extra: null, evidence: null })),
  ];
  return (
    <section className="block">
      <h2 className="label">Questions</h2>
      <div className="faq">
        {faqs.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <div className="faq-body">
              <p>{f.a}</p>
              {f.extra && <p>{f.extra}</p>}
              {f.evidence && <EvidenceBadge evidence={f.evidence} />}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
