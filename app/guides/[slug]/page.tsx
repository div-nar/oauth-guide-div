import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessPicker } from "@/components/AccessPicker";
import { AgentLogos } from "@/components/AgentLogos";
import { AppLogo } from "@/components/AppLogo";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { HandoffButtons } from "@/components/HandoffButtons";
import { PathVisual } from "@/components/PathVisual";
import { StepTable } from "@/components/StepTable";
import { ViewToggle } from "@/components/ViewToggle";
import { getBaseUrl } from "@/lib/base-url";
import type { Evidence } from "@/lib/guide-schema";
import { getGuide } from "@/lib/guides";

const GLOSSARY: [string, string][] = [
  ["What is an OAuth app?", "Your app's registration with the provider. It sets the name users see on the 'Allow?' screen and what you may ask for."],
  ["What are the client ID and secret?", "Your app's username and password. The ID is public. Keep the secret private, and paste it into Composio yourself."],
  ["What is a redirect address (redirect URI)?", "Where the provider sends people after they click Allow. With Composio, you copy it from your auth config."],
  ["What are scopes?", "The specific permissions you ask for, such as 'read email'. More powerful scopes mean more review."],
];

type Faq = { q: string; a: string; extra?: string; evidence?: Evidence };

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

  const faqs: Faq[] = [
    ...(g.existingApp
      ? [{ q: `I already have a ${g.app.name} app. What changes?`, a: g.existingApp.summary }]
      : []),
    ...(g.existingApp?.reReviewTriggers ?? []).map((t) => ({ q: `What if ${t.trigger.charAt(0).toLowerCase() + t.trigger.slice(1)}?`, a: t.effect, evidence: t.evidence })),
    ...g.forks.map((f) => ({ q: `What if ${f.condition.charAt(0).toLowerCase() + f.condition.slice(1)}?`, a: f.effect, evidence: f.evidence })),
    ...g.nuances.map((n) => ({ q: n.title, a: n.detail, extra: `If you're stuck: ${n.ifStuck}`, evidence: n.evidence })),
    ...GLOSSARY.map(([q, a]) => ({ q, a })),
  ];

  return (
    <main className="page">
      <nav className="crumbs small" aria-label="Breadcrumb">
        <Link href="/">guides</Link> <span aria-hidden>/</span> <span>{g.app.name}</span>
      </nav>
      <header className="guide-head">
        <AppLogo name={g.app.name} website={g.app.website} logoUrl={g.app.logoUrl} size={56} />
        <div>
          <h1>{g.app.name} OAuth app</h1>
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

      {g.steps.length > 0 && (
        <section className="block">
          <h2 className="label">The path</h2>
          <PathVisual guide={g} />
        </section>
      )}

      {g.whoYouNeed.length > 0 && (
        <section className="block">
          <h2 className="label">Who you&apos;ll need</h2>
          <ul className="who-list">
            {g.whoYouNeed.map((w) => (
              <li key={w.role}><strong>{w.role}</strong><span className="muted">{w.why}</span></li>
            ))}
          </ul>
        </section>
      )}

      {g.steps.length > 0 && (
        <section className="block">
          <h2 className="label">Steps</h2>
          <StepTable steps={g.steps} />
        </section>
      )}

      <section className="block">
        <h2 className="label">Works with your agent</h2>
        <p className="muted">
          Every guide has a plain-text version at <a href={`/guides/${g.slug}.md`}>/guides/{g.slug}.md</a> that
          coding agents read directly. Hand it over and your agent does its steps, then stops for yours.
        </p>
        <AgentLogos size={28} />
        <HandoffButtons guide={g} baseUrl={baseUrl} />
      </section>

      {faqs.length > 0 && (
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
      )}

      <ViewToggle slug={g.slug} current="human" />
    </main>
  );
}
