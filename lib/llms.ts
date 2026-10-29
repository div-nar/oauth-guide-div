import { listGeneratedGuides } from "@/lib/guides";
import { listLibraryGuides } from "@/lib/library";

// The agent-facing index: served at /llms.txt and shown in the home page's Machine view.
export async function buildIndex(base: string): Promise<string> {
  const generated = await listGeneratedGuides(50).catch(() => []);
  const line = (g: { slug: string; app: { name: string }; verdict: { difficulty: string; summary: string }; useCases: { id: string }[] }) =>
    `- [${g.app.name}](${base}/guides/${g.slug}.md): ${g.verdict.difficulty}. ${g.verdict.summary}${g.useCases.length ? ` (access: ${g.useCases.map((u) => `\`${u.id}\``).join(", ")})` : ""}`;
  return [
    "# OAuth Guide",
    "",
    "> How to create and get approval for your own OAuth app with each provider, for use in your own code. Each guide tags steps [AGENT] (an agent can do it in the user's signed-in browser or CLI), [YOU] (a person must) and [WAIT] (provider review).",
    "",
    "Agents: fetch a guide's Markdown, do the [AGENT] steps, and stop to ask the user at each [YOU] step. Never ask the user to paste secrets into chat.",
    "",
    "## How to read a guide",
    "",
    `- ${base}/guides/<app-name>.md is the whole guide. Difficulty depends on the access the agent needs: add ?access=<id> (ids are listed below, combine with commas) for one path, and &existing=1 if the user already has an OAuth app.`,
    `- ${base}/guides/<app-name>.json is the same guide as structured data.`,
    "- Sections, in the same order as the web page: First, ask the user (when no access is chosen), difficulty per access, Can't wait? Connect on Composio, Before you begin, Steps, Common pitfalls, Troubleshooting, Protocol (OAuth version, PKCE, callback rule, tokens, state), Questions, Configuration.",
    "- Read Protocol before you write OAuth code. It differs by provider: for example, Slack accepts a callback subdirectory and GitHub needs an exact match.",
    "- Every claim carries evidence: sourced (with links), uncertain (with the reason), or tested.",
    "",
    "## Curated (written by a person from official docs)",
    "",
    ...listLibraryGuides().map(line),
    ...(generated.length ? ["", "## Agentic Search (researched by an agent, not yet reviewed by a person)", "", ...generated.map(line)] : []),
    "",
    "## Any other app",
    "",
    `- Fetch ${base}/guides/<app-name>.md for any app. If there is no guide yet, research starts automatically and the response (HTTP 202) says when to fetch again, usually about 2 minutes.`,
    `- Or POST ${base}/api/generate with JSON {"query": "<app name or website>"}; poll the returned statusUrl until status is "done".`,
    "",
  ].join("\n");
}
