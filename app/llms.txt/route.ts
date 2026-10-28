import { getBaseUrl } from "@/lib/base-url";
import { listLibraryGuides } from "@/lib/library";

export async function GET() {
  const base = await getBaseUrl();
  const lines = [
    "# OAuth App Guides",
    "",
    "> How to create and get approval for your own OAuth app with each provider, for use with Composio. Each guide tags steps [AGENT] (an agent can do it in the user's signed-in browser or CLI), [YOU] (a person must) and [WAIT] (provider review).",
    "",
    "Agents: fetch a guide's Markdown, do the [AGENT] steps, and stop to ask the user at each [YOU] step. Never ask the user to paste secrets into chat.",
    "",
    "## Guides",
    "",
    ...listLibraryGuides().map(
      (g) => `- [${g.app.name}](${base}/guides/${g.slug}.md): ${g.verdict.difficulty}. ${g.verdict.summary}`,
    ),
    "",
    "## Any other app",
    "",
    `- Generate a guide: POST ${base}/api/generate with JSON {"query": "<app name or website>"} (streams Server-Sent Events, ends with the guide's slug).`,
  ];
  return new Response(lines.join("\n") + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
