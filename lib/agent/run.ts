import Anthropic from "@anthropic-ai/sdk";
import type {
  BetaContentBlock,
  BetaContentBlockParam,
  BetaMessage,
  BetaMessageParam,
  MessageCreateParamsStreaming,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { z } from "zod";
import { type AgentEvent, toAgentEvent } from "@/lib/agent/events";
import { SYSTEM_PROMPT, userPrompt } from "@/lib/agent/prompt";
import { toStrictSchema } from "@/lib/agent/strict-schema";
import { type Evidence, type Guide, GuideSchema } from "@/lib/guide-schema";
import { resolveSlug } from "@/lib/slug";

type Params = Omit<MessageCreateParamsStreaming, "stream">;
export type ModelCall = (params: Params, onBlock: (b: BetaContentBlock) => void) => Promise<BetaMessage>;

const MAX_CONTINUATIONS = 4;
const MAX_INVALID = 2;

// Anthropic directly when ANTHROPIC_API_KEY is set; otherwise OpenRouter's
// Anthropic-compatible endpoint (same model, no beta features such as fallbacks).
const viaOpenRouter = () => !process.env.ANTHROPIC_API_KEY && !!process.env.OPENROUTER_API_KEY;

const defaultCall: ModelCall = async (params, onBlock) => {
  if (viaOpenRouter()) {
    const client = new Anthropic({ baseURL: "https://openrouter.ai/api", apiKey: null, authToken: process.env.OPENROUTER_API_KEY });
    const rest: Record<string, unknown> = { ...params, model: "anthropic/claude-opus-5.5" };
    delete rest.betas;
    delete rest.fallbacks;
    const stream = client.messages.stream(rest as never);
    stream.on("contentBlock", onBlock as never);
    return (await stream.finalMessage()) as unknown as BetaMessage;
  }
  const client = new Anthropic();
  const stream = client.beta.messages.stream(params);
  stream.on("contentBlock", onBlock);
  return stream.finalMessage();
};

const submitTool = {
  name: "submit_guide",
  description: "Submit the finished guide. Call this exactly once, after research is done.",
  strict: true,
  input_schema: toStrictSchema(z.toJSONSchema(GuideSchema, { io: "input" })) as never,
};

export function normalizeUrl(u: string): string {
  try {
    const x = new URL(u);
    return `${x.host.toLowerCase().replace(/^www\./, "")}${x.pathname.replace(/\/+$/, "")}`;
  } catch {
    return u;
  }
}

// URLs the agent actually saw: search results it was shown and pages it fetched.
function collectSeen(block: BetaContentBlock, seen: Set<string>) {
  const b = block as { type: string; content?: unknown };
  if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
    for (const r of b.content as { url?: string }[]) if (r.url) seen.add(normalizeUrl(r.url));
  }
  if (b.type === "web_fetch_tool_result" && b.content && typeof b.content === "object") {
    const url = (b.content as { url?: string }).url;
    if (url) seen.add(normalizeUrl(url));
  }
}

function sanitizeEvidence(e: Evidence, seen: Set<string>): Evidence {
  const sources = e.sources.filter((s) => seen.has(normalizeUrl(s.url)));
  const dropped = e.sources.length - sources.length;
  const note = dropped ? [e.note, "The agent cited a page it did not open, so that citation was removed."].filter(Boolean).join(" ") : e.note;
  // The agent never ran the flow, so it cannot claim "tested".
  const level = e.level === "uncertain" || sources.length === 0 ? "uncertain" : "sourced";
  return { ...e, sources, level, note: level === "uncertain" && !note ? "No source given." : note };
}

function finalize(raw: unknown, query: string, today: string, seen: Set<string>): Guide {
  const r = raw as Record<string, unknown>;
  const g = GuideSchema.parse({ ...r, slug: resolveSlug(query), generatedBy: "agent", lastChecked: today });
  return {
    ...g,
    useCases: g.useCases.map((u) => ({ ...u, evidence: sanitizeEvidence(u.evidence, seen) })),
    steps: g.steps.map((s) => ({ ...s, evidence: sanitizeEvidence(s.evidence, seen) })),
    forks: g.forks.map((f) => ({ ...f, evidence: sanitizeEvidence(f.evidence, seen) })),
    nuances: g.nuances.map((n) => ({ ...n, evidence: sanitizeEvidence(n.evidence, seen) })),
  };
}

export async function runGuideAgent(
  query: string,
  emit: (e: AgentEvent) => void,
  deps: { call?: ModelCall; today?: string } = {},
): Promise<Guide> {
  const call = deps.call ?? defaultCall;
  const today = deps.today ?? new Date().toISOString().slice(0, 10);
  const messages: BetaMessageParam[] = [{ role: "user", content: userPrompt(query, today) }];
  const seen = new Set<string>();
  let continuations = 0;
  let invalid = 0;

  for (;;) {
    const params: Params = {
      model: "claude-opus-5-5",
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: 6 },
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 8, max_content_tokens: 12000 },
        submitTool,
      ],
      tool_choice: { type: "auto" },
      messages,
    };
    const res = await call(params, (b) => {
      collectSeen(b, seen);
      const e = toAgentEvent(b);
      if (e) emit(e);
    });

    if (res.stop_reason === "refusal") throw new Error("The model declined to research this app.");
    if (res.stop_reason === "max_tokens") throw new Error("The guide ran too long to finish.");
    messages.push({ role: "assistant", content: res.content as BetaContentBlockParam[] });

    if (res.stop_reason === "pause_turn") {
      if (++continuations > MAX_CONTINUATIONS) throw new Error("Research took too long. Try again or try the app's website.");
      continue;
    }

    const submit = res.content.find((b) => b.type === "tool_use" && b.name === "submit_guide");
    if (!submit || submit.type !== "tool_use") {
      if (++invalid >= MAX_INVALID) throw new Error("The agent finished without producing a guide.");
      messages.push({ role: "user", content: "Call submit_guide now with the finished guide." });
      continue;
    }

    try {
      emit({ type: "status", text: "Checking the guide's structure" });
      return finalize(submit.input, query, today, seen);
    } catch (err) {
      if (++invalid >= MAX_INVALID) throw new Error("The agent's guide did not match the required structure twice.");
      const detail = err instanceof z.ZodError ? z.prettifyError(err).slice(0, 1500) : String(err);
      messages.push({
        role: "user",
        content: [{ type: "tool_result", tool_use_id: submit.id, is_error: true, content: `Invalid guide. Fix and resubmit:\n${detail}` }],
      });
    }
  }
}
