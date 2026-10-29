import { AgentLaunchers } from "@/components/AgentLaunchers";
import { ViewToggle } from "@/components/ViewToggle";
import { CopyLine } from "@/components/CopyLine";
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
    options: g.useCases.map((u) => ({ id: u.id, label: u.label, difficulty: u.difficulty })),
    defaultAccess: (g.useCases.find((u) => u.difficulty === v.difficulty) ?? g.useCases[0])?.id ?? null,
    hasExisting: !!g.existingApp,
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
          Your agent needs your own OAuth app to work in the Gmail, Slack or HubSpot account of a user. Some apps
          take five minutes to set up. Others need weeks of review. Select an app to see the steps and the
          problems. Then give the setup to your coding agent.
        </p>
      </section>


      <section className="handoff home-handoff" aria-label="Give it to your agent">
        <div className="handoff-head">
          <div>
            <h2 className="handoff-title">Give it to your agent</h2>
            <p>Agents read the plain-text version of each guide. Click the prompt to copy it. Or, select your agent.</p>
          </div>
          <div className="handoff-actions">
            <AgentLaunchers prompt={prompt} />
          </div>
        </div>
        <CopyLine text={prompt} />
      </section>

      <GuideTable rows={rows} />
      <ViewToggle human="/" machine="/ai" current="human" />
    </main>
  );
}
