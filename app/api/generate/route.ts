import { clientIp, startResearch } from "@/lib/jobs";

export const maxDuration = 300;

// POST {query}: returns at once. Either the guide already exists, or a background
// research job was started (or reused); poll GET /api/generate/<id> for progress.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { query?: string };
  const r = await startResearch(body.query ?? "", clientIp(req));
  if (r.kind === "rejected") return Response.json({ error: r.reason }, { status: r.status });
  if (r.kind === "ready") return Response.json({ status: "done", slug: r.slug, guide: `/guides/${r.slug}` });
  return Response.json(
    { status: "started", jobId: r.job.id, slug: r.job.slug, statusUrl: `/api/generate/${r.job.id}`, guide: `/guides/${r.job.slug}` },
    { status: 202 },
  );
}
