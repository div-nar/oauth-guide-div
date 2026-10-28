import type { AgentEvent } from "@/lib/agent/events";
import { runGuideAgent } from "@/lib/agent/run";
import { query } from "@/lib/db";
import { getGuide, saveGuide } from "@/lib/guides";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveSlug } from "@/lib/slug";
import { validateQuery } from "@/lib/validate-query";

export const maxDuration = 300;

function sse(e: AgentEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(e)}\n\n`);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { query?: string };
  const check = validateQuery(body.query ?? "");
  if (!check.ok) return Response.json({ error: check.reason }, { status: 400 });
  const q = check.value;
  const slug = resolveSlug(q);
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: AgentEvent) => controller.enqueue(sse(e));
      try {
        if (await getGuide(slug)) {
          send({ type: "done", slug });
          return;
        }
        const limit = await checkRateLimit(ip, new Date());
        if (!limit.allowed) {
          send({ type: "error", message: limit.reason! });
          return;
        }
        const [row] = await query<{ id: number }>(
          "INSERT INTO generations (ip, query) VALUES ($1, $2) RETURNING id",
          [ip, q],
        );
        send({ type: "status", text: `Researching ${q}` });
        try {
          const guide = await runGuideAgent(q, send);
          await saveGuide(guide, q);
          await query("UPDATE generations SET status = 'done' WHERE id = $1", [row.id]);
          send({ type: "done", slug: guide.slug });
        } catch (err) {
          await query("UPDATE generations SET status = 'failed' WHERE id = $1", [row.id]);
          throw err;
        }
      } catch (err) {
        console.error("generate failed", err);
        send({ type: "error", message: err instanceof Error ? err.message : "Something went wrong. Try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform" },
  });
}
