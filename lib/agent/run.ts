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

const defaultCall: ModelCall = async (params, onBlock) => {
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

function sanitizeEvidence(e: Evidence): Evidence {
  // The agent never ran the flow, so it cannot claim "tested".
  if (e.level !== "tested") return e;
  return e.sources.length
    ? { ...e, level: "sourced" }
    : { ...e, level: "uncertain", note: e.note ?? "No source given." };
}

function finalize(raw: unknown, query: string, today: string): Guide {
  const r = raw as Record<string, unknown>;
  const g = GuideSchema.parse({ ...r, slug: resolveSlug(query), generatedBy: "agent", lastChecked: today });
  return {
    ...g,
    steps: g.steps.map((s) => ({ ...s, evidence: sanitizeEvidence(s.evidence) })),
    forks: g.forks.map((f) => ({ ...f, evidence: sanitizeEvidence(f.evidence) })),
    nuances: g.nuances.map((n) => ({ ...n, evidence: sanitizeEvidence(n.evidence) })),
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
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 8 },
        submitTool,
      ],
      tool_choice: { type: "auto" },
      messages,
    };
    const res = await call(params, (b) => {
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
      return finalize(submit.input, query, today);
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
