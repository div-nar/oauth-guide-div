import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideBody } from "@/components/GuideBody";
import { AppLogo } from "@/components/AppLogo";
import { BlockedList, FaqList, WhoList } from "@/components/GuideExtras";
import { HandoffButtons } from "@/components/HandoffButtons";
import { StepTable } from "@/components/StepTable";
import { ViewToggle } from "@/components/ViewToggle";
import { getBaseUrl } from "@/lib/base-url";
import { getGuide } from "@/lib/guides";



export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const g = await getGuide((await params).slug);
  return g ? { title: `${g.app.name} OAuth app setup`, description: g.verdict.summary } : {};
}

export default async function GuidePage({ params, searchParams }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const g = await getGuide(slug);
  if (!g) {
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
    const name = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return (
      <main className="page">
        <nav className="crumbs small" aria-label="Breadcrumb"><Link href="/">guides</Link> <span aria-hidden>/</span> <span>{name}</span></nav>
        <h1 className="research-title">No guide for {name} yet</h1>
        <p className="lede">An agent can research it from the official developer docs now. It takes about two minutes, and you can keep browsing while it works.</p>
        <p><Link className="btn" href={`/generate?q=${encodeURIComponent(name)}`}>Research {name}</Link></p>
      </main>
    );
  }
  const baseUrl = await getBaseUrl();
  const picked = typeof sp.access === "string" ? sp.access.split(",").filter((id) => g.useCases.some((u) => u.id === id)) : [];
  const headline = g.useCases.find((u) => u.difficulty === g.verdict.difficulty) ?? g.useCases[0];
  const initialIds = picked.length ? picked : headline ? [headline.id] : [];


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
            {g.generatedBy === "agent" && (
              <>
                {" "}
                <Link className="refresh-link" href={`/generate?q=${encodeURIComponent(g.app.name)}&exact=1&refresh=1`}>Re-check now</Link>
              </>
            )}
          </p>
        </div>
      </header>

      {g.oauth.supported && headline ? (
        <GuideBody guide={g} initialIds={initialIds} initialExisting={sp.existing === "1"} baseUrl={baseUrl} />
      ) : (
        <>
          <HandoffButtons guide={g} baseUrl={baseUrl} />
          <p className="verdict-summary">{g.verdict.summary} {g.oauth.notes}</p>
          <WhoList guide={g} ids={null} />
          {g.steps.length > 0 && (
            <section className="block">
              <h2 className="label">Steps</h2>
              <StepTable steps={g.steps} />
            </section>
          )}
          <BlockedList guide={g} ids={null} />
          <FaqList guide={g} ids={null} />
        </>
      )}

      {!(g.oauth.supported && headline) && <ViewToggle human={`/guides/${g.slug}`} machine={`/guides/${g.slug}/ai`} current="human" />}
    </main>
  );
}
