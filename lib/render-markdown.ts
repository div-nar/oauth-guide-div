import type { Evidence, Guide, Step } from "@/lib/guide-schema";

export const OWNER_TAG: Record<Step["owner"], string> = {
  agent: "[AGENT]",
  human: "[YOU]",
  waiting: "[WAIT]",
};

const range = (r: { min: number; max: number } | null | undefined, unit: string) =>
  r ? (r.min === r.max ? `${r.min} ${unit}` : `${r.min}-${r.max} ${unit}`) : null;

function evidenceLine(e: Evidence): string {
  const src = e.sources.map((s) => `[${s.title}](${s.url})`).join(", ");
  return `Evidence: ${e.level}${src ? ` (${src})` : ""}${e.note ? `. Note: ${e.note}` : ""}`;
}

export function guideToMarkdown(g: Guide, baseUrl: string): string {
  const v = g.verdict;
  const out: string[] = [
    `# OAuth app setup: ${g.app.name}`,
    "",
    `Canonical: ${baseUrl}/guides/${g.slug} | Last checked: ${g.lastChecked} | Source: ${g.generatedBy}`,
    "",
    `Difficulty: ${v.difficulty} | Hands-on: ${range(v.handsOnMinutes, "min")} | Waiting: ${range(v.waitDays, "days")}`,
    "",
    v.summary,
    "",
    "Step tags: [AGENT] an agent can do this in your signed-in browser or CLI. [YOU] a person must do this. [WAIT] waiting on the provider.",
  ];
  if (g.oauth.notes) out.push("", `Note: ${g.oauth.notes}`);
  if (g.whoYouNeed.length) {
    out.push("", "## Who you need");
    for (const w of g.whoYouNeed) out.push(`- ${w.role}: ${w.why}`);
  }
  out.push("", "## Steps");
  g.steps.forEach((s, i) => {
    const time = range(s.minutes, "min") ?? range(s.waitDays, "days");
    out.push("", `${i + 1}. ${OWNER_TAG[s.owner]} ${s.title}${time ? ` (${time})` : ""}`, `   ${s.plain}`);
    if (s.technical) out.push(`   Technical: ${s.technical}`);
    if (s.whyHuman) out.push(`   Why a person: ${s.whyHuman}`);
    if (s.url) out.push(`   Go to: ${s.url}`);
    out.push(`   ${evidenceLine(s.evidence)}`);
  });
  if (g.forks.length) {
    out.push("", "## When it gets harder or easier");
    for (const f of g.forks) out.push(`- If ${f.condition}: ${f.effect} ${evidenceLine(f.evidence)}`);
  }
  if (g.nuances.length) {
    out.push("", "## Nuances and blockers");
    for (const n of g.nuances) out.push(`- ${n.title}: ${n.detail} If stuck: ${n.ifStuck} ${evidenceLine(n.evidence)}`);
  }
  out.push("", "## Configuration");
  if (g.config.consoleUrl) out.push(`- Console: ${g.config.consoleUrl}`);
  if (g.config.redirectUriNote) out.push(`- Redirect URI: ${g.config.redirectUriNote}`);
  for (const s of g.config.scopes) out.push(`- Scope \`${s.name}\` (${s.sensitivity}): ${s.plain}`);
  return out.join("\n") + "\n";
}
