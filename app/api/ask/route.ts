import { complete } from "@/lib/agent/openrouter";
import { answerQuestion, checkQuestion } from "@/lib/ask";
import { getBaseUrl } from "@/lib/base-url";
import { getGuide } from "@/lib/guides";

export const maxDuration = 60;

// POST {slug, question, access?, existing?}: a short answer from that guide only.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { slug?: string; question?: unknown; access?: string[]; existing?: boolean };
  const q = checkQuestion(body.question);
  if (!q.ok) return Response.json({ error: q.reason }, { status: 400 });
  const g = typeof body.slug === "string" ? await getGuide(body.slug) : null;
  if (!g) return Response.json({ error: "There is no guide for that app yet." }, { status: 404 });
  const ids = (Array.isArray(body.access) ? body.access : []).filter((id) => g.useCases.some((u) => u.id === id));
  const sel = ids.length || body.existing ? { ids, existing: !!body.existing } : undefined;
  try {
    const answer = await answerQuestion(g, q.value, await getBaseUrl(), sel, (m) => complete(m, 500));
    return Response.json({ answer });
  } catch (err) {
    console.error("ask failed", err);
    return Response.json({ error: "No answer is available now. Try again in one minute." }, { status: 502 });
  }
}
