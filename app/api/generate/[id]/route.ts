import { getJob } from "@/lib/jobs";

export async function GET(_req: Request, ctx: RouteContext<"/api/generate/[id]">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Unknown job" }, { status: 404 });
  const job = await getJob(id);
  if (!job) return Response.json({ error: "Unknown job" }, { status: 404 });
  return Response.json(job, { headers: { "cache-control": "no-store" } });
}
