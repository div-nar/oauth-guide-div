import { getBaseUrl } from "@/lib/base-url";
import { getGuide } from "@/lib/guides";
import { clientIp, startResearch } from "@/lib/jobs";
import { resolveSlug } from "@/lib/slug";
import { guideToMarkdown } from "@/lib/render-markdown";

export const maxDuration = 300;

// Agents can fetch any app here. Unknown apps start research in the background
// and get a 202 telling them when to fetch again.
export async function GET(req: Request, ctx: RouteContext<"/api/guides/[slug]/md">) {
  const slug = (await ctx.params).slug;
  const base = await getBaseUrl();
  const g = await getGuide(slug);
  if (g) {
    const sp = new URL(req.url).searchParams;
    const ids = (sp.get("access") ?? "").split(",").filter((id) => g.useCases.some((u) => u.id === id));
    const sel = ids.length || sp.get("existing") === "1" ? { ids, existing: sp.get("existing") === "1" } : undefined;
    return new Response(guideToMarkdown(g, base, sel), { headers: { "content-type": "text/markdown; charset=utf-8" } });
  }

  const name = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const r = await startResearch(name, clientIp(req));
  const text = (body: string, status: number) =>
    new Response(body, { status, headers: { "content-type": "text/markdown; charset=utf-8", "retry-after": "60" } });
  if (r.kind === "rejected") return text(`# No guide for ${slug} yet\n\n${r.reason}\n`, r.status);
  if (r.kind === "ready") return text(guideToMarkdown((await getGuide(r.slug))!, base), 200);
  if (r.kind === "ambiguous") {
    const opts = r.options.map((o) => `- ${o.name}: ${o.description} Fetch ${base}/guides/${resolveSlug(o.query)}.md`);
    return text([`# "${name}" could mean several apps`, "", "Ask the user which one, then fetch that guide:", "", ...opts, ""].join("\n"), 300);
  }
  return text(
    [
      `# Researching ${r.job.query}`,
      "",
      "There is no guide for this app yet, so a research agent has started reading its official developer docs.",
      `Fetch ${base}/guides/${r.job.slug}.md again in about 2 minutes.`,
      `Progress: ${base}/api/generate/${r.job.id}`,
      "",
    ].join("\n"),
    202,
  );
}
