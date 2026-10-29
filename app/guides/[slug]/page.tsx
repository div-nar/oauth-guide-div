import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GuideBody } from "@/components/GuideBody";
import { AppLogo } from "@/components/AppLogo";
import { GuideCheck } from "@/components/EvidenceBadge";
import { getBaseUrl } from "@/lib/base-url";
import { getGuide } from "@/lib/guides";
import { logoFor } from "@/lib/logos";



export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const g = await getGuide((await params).slug);
  // Agents that land on the web page can find the Markdown version from here.
  return g
    ? {
        title: `${g.app.name} ${g.oauth.supported ? "OAuth app" : "API access"} setup`,
        description: g.verdict.summary,
        alternates: { types: { "text/markdown": `/guides/${g.slug}.md` } },
        // The tab shows the app it is about.
        icons: { icon: logoFor(g.app).src },
      }
    : {};
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
        <p className="lede">An agent can research it now from the official developer docs. This takes approximately two minutes. You can go to other pages while it works.</p>
        <p><Link className="btn" href={`/generate?q=${encodeURIComponent(name)}`}>Research {name}</Link></p>
      </main>
    );
  }
  // Another name for an app that has its own guide: go to the guide's own address.
  if (g.slug !== slug) redirect(`/guides/${g.slug}`);
  const baseUrl = await getBaseUrl();
  const picked = typeof sp.access === "string" ? sp.access.split(",").filter((id) => g.useCases.some((u) => u.id === id)) : [];
  const headline = g.useCases.find((u) => u.difficulty === g.verdict.difficulty) ?? g.useCases[0];
  // ?access= with nothing after it means no row ticked: the whole guide.
  const initialIds = picked.length ? picked : sp.access === "" ? [] : headline ? [headline.id] : [];


  return (
    <main className="page">
      <nav className="crumbs small" aria-label="Breadcrumb">
        <Link href="/">guides</Link> <span aria-hidden>/</span> <span>{g.app.name}</span>
      </nav>
      <header className="guide-head">
        <AppLogo name={g.app.name} website={g.app.website} logoUrl={g.app.logoUrl} size={56} />
        <div>
          <h1>{g.app.name}</h1>
          <p className="small muted">
            {g.generatedBy === "agent" ? "Agentic Search from public docs" : "Curated from official docs"},
            last checked {g.lastChecked}
            {g.generatedBy === "agent" && (
              <>
                {" "}
                <Link className="refresh-link" href={`/generate?q=${encodeURIComponent(g.app.name)}&exact=1&refresh=1`}>Re-check now</Link>
              </>
            )}
          </p>
        </div>
        <GuideCheck checks={g.checks} />
      </header>

      <GuideBody guide={g} initialIds={initialIds} initialExisting={sp.existing === "1"} baseUrl={baseUrl} />
    </main>
  );
}
