import { AskBox } from "@/components/AskBox";
import type { Guide } from "@/lib/guide-schema";
import { appliesTo } from "@/lib/paths";

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
      <h2 className="label">Before you begin</h2>
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

function WrenchIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.8-.4-.4-2.8z" />
    </svg>
  );
}

// At most two sentences on the page; the full text is on hover, in the Markdown and in the ask box's context.
function brief(text: string): string {
  const s = text.split(/(?<=[.!?])\s+(?=[A-Z0-9`"'(])/);
  return s.length > 2 ? s.slice(0, 2).join(" ") : text;
}

// Things that catch people out, each as a red mark, the problem and one line of detail.
export function PitfallList({ guide: g, ids }: { guide: Guide; ids: string[] | null }) {
  const items = g.nuances.filter((n) => !ids || appliesTo(n.useCaseIds, ids));
  if (!items.length) return null;
  return (
    <section className="block">
      <h2 className="label">Common pitfalls</h2>
      <ul className="blockers">
        {items.map((n) => (
          <li key={n.title} className="blocker" title={`${n.detail}\n\nIf you are stuck: ${n.ifStuck}`}>
            <span className="blocker-icon" aria-hidden>!</span>
            <p className="blocker-where"><span>{n.title.replace(/\.$/, "")}</span></p>
            <p className="blocker-fix">{brief(n.detail)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const PROTOCOL_LABELS = [
  ["version", "Version"],
  ["flow", "Flow"],
  ["pkce", "PKCE"],
  ["callback", "Callback"],
  ["tokens", "Tokens"],
  ["state", "State"],
] as const;

// How this provider applies OAuth. Unconfirmed facts show in orange with the reason.
export function ProtocolList({ guide: g }: { guide: Guide }) {
  const p = g.protocol;
  if (!p) return null;
  const sources = [...new Map(PROTOCOL_LABELS.flatMap(([k]) => p[k].evidence.sources).map((s) => [s.url, s])).values()];
  return (
    <section className="block">
      <h2 className="label">Protocol</h2>
      <dl className="protocol">
        {PROTOCOL_LABELS.map(([k, label]) => {
          const f = p[k];
          const unconfirmed = f.evidence.level === "uncertain";
          return (
            <div key={k} title={unconfirmed && f.evidence.note ? `Unconfirmed: ${f.evidence.note}` : undefined}>
              <dt>{label}</dt>
              <dd>
                <b className={unconfirmed ? "unc" : undefined}>{f.value}</b>
                {f.note && <span>{inlineCode(f.note)}</span>}
                {unconfirmed && f.evidence.note && <span className="unc-why">Unconfirmed: {f.evidence.note}</span>}
              </dd>
            </div>
          );
        })}
      </dl>
      {sources.length > 0 && (
        <p className="protocol-src">
          Sources: {sources.map((s, i) => <span key={s.url}>{i > 0 && ", "}<a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></span>)}
        </p>
      )}
    </section>
  );
}

function inlineCode(text: string) {
  return text.split(/(`[^`]+`)/).map((part, i) => (part.startsWith("`") && part.endsWith("`") && part.length > 1 ? <code key={i}>{part.slice(1, -1)}</code> : part));
}

// Where it failed, then the fix; the cause shows on hover.
export function BlockedList({ guide: g, ids }: { guide: Guide; ids: string[] | null }) {
  const blockers = (g.blockers ?? []).filter((b) => !ids || appliesTo(b.useCaseIds, ids));
  if (!blockers.length) return null;
  return (
    <section className="block">
      <h2 className="label">Troubleshooting</h2>
      <ul className="blockers">
        {blockers.map((b) => (
          <li key={b.symptom} className="blocker" title={`Why: ${b.cause}\n\nWhat to do: ${b.fix}`}>
            <span className="blocker-icon fix" aria-hidden><WrenchIcon /></span>
            <p className="blocker-where">
              <span>{b.symptom.replace(/\.$/, "")}</span>
              {b.escalate && (
                <a href={b.escalate.url} target="_blank" rel="noreferrer" title={b.escalate.label}>Help<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M9.5 2.5h4v4M13.5 2.5 7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
              )}
            </p>
            <p className="blocker-fix">{brief(b.fix)}</p>
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

