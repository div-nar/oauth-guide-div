import { AgentLogos } from "@/components/AgentLogos";
import { CopyButton } from "@/components/CopyButton";
import { GRADE_WORD } from "@/components/GradeMark";
import { type GuideRow, GuideTable } from "@/components/GuideTable";
import { getBaseUrl } from "@/lib/base-url";
import { formatHandsOn, formatWait } from "@/lib/format";
import type { Difficulty, Guide } from "@/lib/guide-schema";
import { listGeneratedGuides } from "@/lib/guides";
import { listLibraryGuides } from "@/lib/library";

export const dynamic = "force-dynamic";

const ORDER: Difficulty[] = ["easy", "moderate", "hard", "gated", "not_applicable"];

function toRow(g: Guide): GuideRow {
  const v = g.verdict;
  const easiest = [...g.useCases].sort((a, b) => ORDER.indexOf(a.difficulty) - ORDER.indexOf(b.difficulty))[0];
  return {
    slug: g.slug,
    name: g.app.name,
    website: g.app.website,
    logoUrl: g.app.logoUrl,
    difficulty: v.difficulty,
    summary: v.summary,
    handsOn: formatHandsOn(v.handsOnMinutes),
    waiting: formatWait(v.waitDays),
    handsOnMax: v.handsOnMinutes.max,
    waitMax: v.waitDays.max,
    source: g.generatedBy,
    easier: easiest && easiest.difficulty !== v.difficulty ? `${GRADE_WORD[easiest.difficulty]} for: ${easiest.label}` : null,
  };
}

export default async function Home() {
  const base = await getBaseUrl();
  const library = listLibraryGuides();
  const generated = await listGeneratedGuides(20).catch(() => []);
  const rows = [...library, ...generated]
    .map(toRow)
    .sort((a, b) => a.handsOnMax + a.waitMax * 1440 - (b.handsOnMax + b.waitMax * 1440));
  const prompt = `Read ${base}/llms.txt, then help me set up my own Gmail OAuth app for Composio.`;

  return (
    <main className="page wide">
      <nav className="crumbs small" aria-label="Breadcrumb">guides</nav>
      <section className="home-hero">
        <h1>OAuth app guides</h1>
        <p className="lede">
          Before your agent can act in someone&apos;s Gmail, Slack or HubSpot, you need your own OAuth app with
          that provider. Some take five minutes, some take weeks of review. Pick the app, see what blocks you,
          and hand the setup to your coding agent.
        </p>
      </section>


      <GuideTable rows={rows} />

      <section className="home-try">
        <div>
          <h2 className="label">Try it with your agent</h2>
          <div className="command">
            <code>{prompt}</code>
            <CopyButton text={prompt} label="Copy" className="copy-btn" />
          </div>
        </div>
        <div>
          <h2 className="label">Works with these agents</h2>
          <AgentLogos />
        </div>
      </section>
    </main>
  );
}
