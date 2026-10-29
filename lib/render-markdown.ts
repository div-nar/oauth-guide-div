import type { Check, Checks, Evidence, Guide, Step } from "@/lib/guide-schema";
import { appliesTo, combine, type Selection } from "@/lib/paths";

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

// What code saw when it opened the link, kept apart from the evidence so it is never read as "tested".
export function linkCheck(checks: Checks | null | undefined, url: string | undefined): Check | null {
  return (url && checks?.links.find((c) => c.url === url)) || null;
}

const observedLine = (c: Check, date: string) => `Observed (checked by the agent ${date}): ${c.detail}.`.replace(/\.\.$/, ".");

// Composio's own app lets people connect while their app waits for review.
function composioOffer(g: Guide, picked: string[], waiting: boolean): string[] {
  if (!waiting || g.composio?.managedApp !== "yes") return [];
  const out = ["", "## Can't wait? Connect on Composio", `${g.composio.note} ${evidenceLine(g.composio.evidence)}`];
  for (const l of g.composio.limits ?? []) {
    if (l.useCaseIds.some((id) => picked.includes(id))) out.push(`- Limit: ${l.note} ${evidenceLine(l.evidence)}`);
  }
  return out;
}

export function guideToMarkdown(g: Guide, baseUrl: string, sel?: Selection): string {
  const c = sel && g.useCases.length ? combine(g, sel.ids) : null;
  const picked = c?.ids ?? g.useCases.map((u) => u.id);
  const existing = !!(sel?.existing && g.existingApp);
  const v = c ? { ...g.verdict, difficulty: c.difficulty, handsOnMinutes: c.handsOnMinutes, waitDays: c.waitDays, summary: c.summary } : g.verdict;
  const steps = c ? c.steps : g.steps;
  const out: string[] = [
    `# ${g.oauth.supported ? "OAuth app" : "API access"} setup: ${g.app.name}`,
    "",
    `Canonical: ${baseUrl}/guides/${g.slug} | Last checked: ${g.lastChecked} | Source: ${g.generatedBy}`,
    "",
    `Difficulty: ${v.difficulty} | Hands-on: ${range(v.handsOnMinutes, "min")} | Waiting: ${range(v.waitDays, "days")}`,
    "",
    v.summary,
    "",
    "Step tags: [AGENT] an agent can do this in your signed-in browser or CLI. [YOU] a person must do this. [WAIT] waiting on the provider. Tick each box as it is done, and stop at every [YOU] step until the user confirms.",
  ];
  if (c) {
    out.splice(2, 0, `Access: ${c.labels.join(" + ")}${existing ? " | Reusing an existing app" : ""}`, "");
  }
  if (g.oauth.notes) out.push("", `Note: ${g.oauth.notes}`);
  if (g.useCases.length > 1 && !c) {
    out.push(
      "",
      "## First, ask the user",
      `Ask: "What should your agent be able to do in ${g.app.name}? Pick all that apply." Offer the options below, and also ask whether they already have a ${g.app.name} OAuth app.`,
      `Then fetch only their path: ${baseUrl}/guides/${g.slug}.md?access=<ids, comma-separated> (add &existing=1 if they have an app). It drops the steps and review waits they do not need.`,
    );
  }
  if (g.useCases.length && !c) {
    out.push("", "## Difficulty depends on what access you need", "Fetch just one path with ?access=<id> (combine with commas), and add &existing=1 if the user already has an app.");
    for (const u of g.useCases) {
      out.push(
        `- \`${u.id}\` ${u.label}: ${u.difficulty} (hands-on ${range(u.handsOnMinutes, "min")}, waiting ${range(u.waitDays, "days")}). ${u.summary}${u.scopes.length ? ` Scopes: ${u.scopes.join(", ")}.` : ""} Path: ${baseUrl}/guides/${g.slug}.md?access=${u.id}`,
      );
    }
  }
  for (const line of composioOffer(g, picked, v.waitDays.max > 0 && !existing)) out.push(line);
  if (g.whoYouNeed.some((x) => appliesTo(x.useCaseIds, picked))) {
    out.push("", "## What you need");
    for (const w of g.whoYouNeed.filter((x) => appliesTo(x.useCaseIds, picked))) out.push(`- ${w.role}: ${w.why}`);
  }  if (existing && g.existingApp) {
    out.push("", "## You already have an app", g.existingApp.summary, "", "## What could send you back to review");
    for (const t of g.existingApp.reReviewTriggers) out.push(`- ${t.trigger}: ${t.effect} ${evidenceLine(t.evidence)}`);
  }
  if (!existing) out.push("", "## Steps");
  (existing ? [] : steps).forEach((s, i) => {
    const time = range(s.minutes, "min") ?? range(s.waitDays, "days");
    out.push("", `- [ ] ${i + 1}. ${OWNER_TAG[s.owner]} ${s.title}${time ? ` (${time})` : ""}`, `   ${s.plain}`, `   Permalink: ${baseUrl}/guides/${g.slug}#step-${s.id}`);
    if (s.technical) out.push(`   Technical: ${s.technical}`);
    if (s.whyHuman) out.push(`   Why a person: ${s.whyHuman}`);
    if (s.link) out.push(`   Link${s.link.prefilled ? " (pre-filled)" : ""}: ${s.link.url}`);
    out.push(`   ${evidenceLine(s.evidence)}`);
    const seen = linkCheck(g.checks, s.link?.url);
    if (seen && g.checks) out.push(`   ${observedLine(seen, g.checks.date)}`);
  });

  const blockers = (g.blockers ?? []).filter((x) => appliesTo(x.useCaseIds, picked));
  if (blockers.length) {
    out.push("", "## If you get blocked or rejected");
    for (const b of blockers) {
      out.push(`- ${b.symptom}`, `  Why: ${b.cause}`, `  What to do: ${b.fix}`);
      if (b.escalate) out.push(`  Escalate: ${b.escalate.label} ${b.escalate.url}`);
      out.push(`  ${evidenceLine(b.evidence)}`);
    }
  }
  const forks = g.forks.filter((x) => appliesTo(x.useCaseIds, picked));
  const gotchas = g.nuances.filter((x) => appliesTo(x.useCaseIds, picked));
  if (forks.length || gotchas.length) {
    out.push("", "## Questions");
    for (const f of forks) out.push(`- What if ${f.condition}? ${f.effect} ${evidenceLine(f.evidence)}`);
    for (const n of gotchas) out.push(`- ${n.title}: ${n.detail} If stuck: ${n.ifStuck} ${evidenceLine(n.evidence)}`);
  }
  out.push("", "## Configuration");
  if (g.config.consoleUrl) out.push(`- Console: ${g.config.consoleUrl}`);
  if (g.config.authorizeUrl) out.push(`- Sign-in (authorization) endpoint: ${g.config.authorizeUrl}`);
  for (const c of [g.checks?.authorize, g.checks?.discovery]) if (c && g.checks) out.push(`- ${observedLine(c, g.checks.date)}`);
  if (g.config.redirectUriNote) out.push(`- Redirect URI: ${g.config.redirectUriNote}`);
  for (const s of g.config.scopes) out.push(`- Scope \`${s.name}\` (${s.sensitivity}): ${s.plain}`);
  return out.join("\n") + "\n";
}
