import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { ViewToggle } from "@/components/ViewToggle";
import { getBaseUrl } from "@/lib/base-url";
import { getGuide } from "@/lib/guides";
import { guideToMarkdown } from "@/lib/render-markdown";

export default async function MachinePage({ params }: PageProps<"/guides/[slug]/ai">) {
  const { slug } = await params;
  const g = await getGuide(slug);
  if (!g) notFound();
  const baseUrl = await getBaseUrl();
  const md = guideToMarkdown(g, baseUrl);
  return (
    <main className="page">
      <div className="machine-bar">
        <span className="small muted">
          Plain text for agents. Also at <a href={`/guides/${g.slug}.md`}>/guides/{g.slug}.md</a> and{" "}
          <a href={`/guides/${g.slug}.json`}>.json</a>
        </span>
        <CopyButton text={md} label="Copy all" />
      </div>
      <pre className="machine">{md}</pre>
      <ViewToggle slug={g.slug} current="machine" />
    </main>
  );
}
