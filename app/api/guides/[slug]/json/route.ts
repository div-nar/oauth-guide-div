import { getGuide } from "@/lib/guides";

export async function GET(_req: Request, ctx: RouteContext<"/api/guides/[slug]/json">) {
  const g = await getGuide((await ctx.params).slug);
  if (!g) return Response.json({ error: "Guide not found" }, { status: 404 });
  return Response.json(g);
}
