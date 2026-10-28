import { getBaseUrl } from "@/lib/base-url";
import { getGuide } from "@/lib/guides";
import { guideToMarkdown } from "@/lib/render-markdown";

export async function GET(_req: Request, ctx: RouteContext<"/api/guides/[slug]/md">) {
  const g = await getGuide((await ctx.params).slug);
  if (!g) return new Response("Guide not found\n", { status: 404 });
  return new Response(guideToMarkdown(g, await getBaseUrl()), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
