import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { GRADE_MEANING, GRADE_WORD, GradeMark } from "@/components/GradeMark";
import { HandoffButtons } from "@/components/HandoffButtons";
import { PathVisual } from "@/components/PathVisual";
import { StepList } from "@/components/StepList";
import { ViewToggle } from "@/components/ViewToggle";
import { getBaseUrl } from "@/lib/base-url";
import { formatHandsOn, formatWait } from "@/lib/format";
import { getGuide } from "@/lib/guides";

const GLOSSARY: [string, string][] = [
  ["OAuth app", "Your app's registration with the provider. It sets the name users see on the 'Allow?' screen and what you may ask for."],
  ["Client ID and secret", "The username and password for your app. The ID is public. Keep the secret private."],
  ["Redirect address (redirect URI)", "Where the provider sends people after they click Allow. With Composio, you copy it from your auth config."],
  ["Scopes", "The specific permissions you ask for, such as 'read email'. More powerful scopes mean more review."],
];

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const g = await getGuide((await params).slug);
  return g ? { title: `${g.app.name} OAuth app setup`, description: g.verdict.summary } : {};
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const g = await getGuide(slug);
  if (!g) notFound();
  const baseUrl = await getBaseUrl();
  const v = g.verdict;
  const count = (o: string) => g.steps.filter((s) => s.owner === o).length;

  return (
    <main className="page">
      <div className="guide-head">
        <GradeMark difficulty={v.difficulty} size={56} />
        <div>
          <h1>{g.app.name}</h1>
          <div className="grade-word">
            {GRADE_WORD[v.difficulty]}: {GRADE_MEANING[v.difficulty].toLowerCase()}
          </div>
        </div>
      </div>
      <p className="verdict">{v.summary}</p>
      {g.oauth.supported ? (
        <div className="facts">
          <div><b>{formatHandsOn(v.handsOnMinutes)}</b>hands-on</div>
          <div><b>{formatWait(v.waitDays)}</b>waiting on {g.app.name}</div>
          <div><b>{count("agent")} of {g.steps.length}</b>steps your agent can do</div>
        </div>
      ) : (
        g.oauth.notes && <p>{g.oauth.notes}</p>
      )}

      <HandoffButtons guide={g} baseUrl={baseUrl} />

      {g.whoYouNeed.length > 0 && (
        <section className="block who">
          <h2>Who you&apos;ll need</h2>
          <ul>
            {g.whoYouNeed.map((w) => (
              <li key={w.role}><strong>{w.role}.</strong> {w.why}</li>
            ))}
          </ul>
        </section>
      )}

      {g.steps.length > 0 && (
        <section className="block">
          <h2>The path</h2>
          <PathVisual guide={g} />
        </section>
      )}

      {g.steps.length > 0 && (
        <section className="block">
          <h2>Steps</h2>
          <StepList steps={g.steps} />
        </section>
      )}

      {g.forks.length > 0 && (
        <section className="block">
          <h2>When it gets harder or easier</h2>
          {g.forks.map((f) => (
            <div key={f.condition} className="fork">
              <h3>If {f.condition.charAt(0).toLowerCase() + f.condition.slice(1)}</h3>
              <p>{f.effect}</p>
              <EvidenceBadge evidence={f.evidence} />
            </div>
          ))}
        </section>
      )}

      {g.nuances.length > 0 && (
        <section className="block">
          <h2>Gotchas and what to do</h2>
          {g.nuances.map((n) => (
            <div key={n.title} className="nuance">
              <h3>{n.title}</h3>
              <p>{n.detail}</p>
              <p><strong>If you&apos;re stuck:</strong> {n.ifStuck}</p>
              <EvidenceBadge evidence={n.evidence} />
            </div>
          ))}
        </section>
      )}

      {g.config.scopes.length > 0 && (
        <section className="block">
          <h2>Permissions you might ask for</h2>
          <table className="scopes">
            <tbody>
              {g.config.scopes.map((s) => (
                <tr key={s.name}>
                  <td><code>{s.name}</code></td>
                  <td>{s.plain}</td>
                  <td className={`sens ${s.sensitivity}`}>{s.sensitivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {g.config.redirectUriNote && <p className="small muted">{g.config.redirectUriNote}</p>}
        </section>
      )}

      <section className="block">
        <h2>Words you&apos;ll see</h2>
        <dl>
          {GLOSSARY.map(([term, def]) => (
            <div key={term} style={{ marginBottom: 10 }}>
              <dt style={{ fontWeight: 700 }}>{term}</dt>
              <dd style={{ margin: 0 }}>{def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="small muted" style={{ marginTop: 40 }}>
        Last checked {g.lastChecked}.{" "}
        {g.generatedBy === "agent"
          ? "Written by a research agent from public docs and not reviewed by a person. Check anything marked Uncertain."
          : "Researched by hand from official docs."}
      </p>
      <ViewToggle slug={g.slug} current="human" />
    </main>
  );
}
