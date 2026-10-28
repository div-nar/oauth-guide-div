import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { ViewToggle } from "@/components/ViewToggle";
import { getBaseUrl } from "@/lib/base-url";
import { getGuide } from "@/lib/guides";
import { selectionQuery } from "@/lib/paths";
import { guideToMarkdown } from "@/lib/render-markdown";

export default async function MachinePage({ params, searchParams }: PageProps<"/guides/[slug]/ai">) {
  const { slug } = await params;
  const sp = await searchParams;
  const g = await getGuide(slug);
  if (!g) notFound();
  const baseUrl = await getBaseUrl();
  const ids = typeof sp.access === "string" ? sp.access.split(",").filter((id) => g.useCases.some((u) => u.id === id)) : [];
  const sel = ids.length || sp.existing === "1" ? { ids, existing: sp.existing === "1" } : undefined;
  const q = sel ? selectionQuery(sel) : "";
  const md = guideToMarkdown(g, baseUrl, sel);
  return (
    <main className="page">
      <div className="machine-bar">
        <span className="small muted">
          Plain text for agents. Also at <a href={`/guides/${g.slug}.md${q}`}>/guides/{g.slug}.md{q}</a> and{" "}
          <a href={`/guides/${g.slug}.json`}>.json</a>
        </span>
        <CopyButton text={md} label="Copy all" className="copy-btn" />
      </div>
      <pre className="machine">{md}</pre>
      <ViewToggle human={`/guides/${g.slug}${q}`} machine={`/guides/${g.slug}/ai${q}`} current="machine" />
    </main>
  );
}
