import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessPicker } from "@/components/AccessPicker";
import { AppLogo } from "@/components/AppLogo";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { HandoffButtons } from "@/components/HandoffButtons";
import { PathVisual } from "@/components/PathVisual";
import { StepList } from "@/components/StepList";
import { ViewToggle } from "@/components/ViewToggle";
import { getBaseUrl } from "@/lib/base-url";
import { getGuide } from "@/lib/guides";

const GLOSSARY: [string, string][] = [
  ["OAuth app", "Your app's registration with the provider. It sets the name users see on the 'Allow?' screen and what you may ask for."],
  ["Client ID and secret", "Your app's username and password. The ID is public. Keep the secret private."],
  ["Redirect address (redirect URI)", "Where the provider sends people after they click Allow. With Composio, you copy it from your auth config."],
  ["Scopes (permissions)", "The specific access you ask for, such as 'read email'. More powerful scopes mean more review."],
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
  const headline = g.useCases.find((u) => u.difficulty === g.verdict.difficulty) ?? g.useCases[0];

  return (
    <main className="page">
      <nav className="crumbs small"><Link href="/">All guides</Link></nav>
      <header className="guide-head">
        <AppLogo name={g.app.name} website={g.app.website} logoUrl={g.app.logoUrl} size={56} />
        <div>
          <h1>{g.app.name}</h1>
          <p className="small muted">
            {g.generatedBy === "agent" ? "Researched by the agent from public docs" : "Researched by hand from official docs"},
            last checked {g.lastChecked}
          </p>
        </div>
      </header>

      {g.oauth.supported && headline ? (
        <AccessPicker useCases={g.useCases} defaultId={headline.id} appName={g.app.name} />
      ) : (
        <p className="verdict-summary">{g.verdict.summary} {g.oauth.notes}</p>
      )}

      <HandoffButtons guide={g} baseUrl={baseUrl} />

      {g.steps.length > 0 && (
        <section className="block">
          <h2>The path</h2>
          <PathVisual guide={g} />
        </section>
      )}

      {g.whoYouNeed.length > 0 && (
        <section className="block">
          <h2>Who you&apos;ll need</h2>
          <ul className="who">
            {g.whoYouNeed.map((w) => (
              <li key={w.role}><strong>{w.role}</strong><span>{w.why}</span></li>
            ))}
          </ul>
        </section>
      )}

      {g.steps.length > 0 && (
        <section className="block">
          <h2>Steps</h2>
          <StepList steps={g.steps} />
        </section>
      )}

      {g.existingApp && (
        <section className="block callout">
          <h2>Already have a {g.app.name} app?</h2>
          <p>{g.existingApp.summary}</p>
          {g.existingApp.reReviewTriggers.length > 0 && (
            <ul className="plain-list">
              {g.existingApp.reReviewTriggers.map((t) => (
                <li key={t.trigger}>
                  <strong>{t.trigger}:</strong> {t.effect}
                  <EvidenceBadge evidence={t.evidence} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {g.forks.length > 0 && (
        <section className="block">
          <h2>What makes it easier or harder</h2>
          {g.forks.map((f) => (
            <div key={f.condition} className="item">
              <h3>If {f.condition.charAt(0).toLowerCase() + f.condition.slice(1)}</h3>
              <p>{f.effect}</p>
              <EvidenceBadge evidence={f.evidence} />
            </div>
          ))}
        </section>
      )}

      {g.nuances.length > 0 && (
        <section className="block">
          <h2>Gotchas</h2>
          {g.nuances.map((n) => (
            <div key={n.title} className="item">
              <h3>{n.title}</h3>
              <p>{n.detail}</p>
              <p><strong>If you&apos;re stuck:</strong> {n.ifStuck}</p>
              <EvidenceBadge evidence={n.evidence} />
            </div>
          ))}
        </section>
      )}

      <details className="block glossary">
        <summary>Words on this page</summary>
        <dl>
          {GLOSSARY.map(([term, def]) => (
            <div key={term}><dt>{term}</dt><dd>{def}</dd></div>
          ))}
        </dl>
      </details>

      <ViewToggle slug={g.slug} current="human" />
    </main>
  );
}
