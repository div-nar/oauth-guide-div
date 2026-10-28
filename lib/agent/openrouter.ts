import type { ChatMessage, ChatResult, SearchResult } from "@/lib/agent/run";

const BASE = "https://openrouter.ai/api/v1/chat/completions";
export const AGENT_MODEL = process.env.AGENT_MODEL ?? "openai/gpt-5.6-luna";
const SEARCH_MODEL = process.env.SEARCH_MODEL ?? "openai/gpt-5.6-luna";

async function post(body: Record<string, unknown>) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("The research agent is not configured (OPENROUTER_API_KEY is missing).");
  const res = await fetch(BASE, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "x-title": "OAuth App Guides" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`The model provider returned ${res.status}: ${json?.error?.message ?? "unknown error"}`);
  return json;
}

export async function chat(messages: ChatMessage[], tools: unknown[]): Promise<ChatResult> {
  const json = await post({
    model: AGENT_MODEL,
    messages,
    tools,
    tool_choice: "auto",
    parallel_tool_calls: true,
    max_tokens: 24_000,
  });
  const choice = json.choices?.[0];
  if (!choice) throw new Error("The model returned no answer.");
  return { finish_reason: choice.finish_reason, message: choice.message };
}

// Web search through OpenRouter's web plugin; we only use the cited results.
export async function search(query: string): Promise<SearchResult[]> {
  const json = await post({
    model: SEARCH_MODEL,
    plugins: [{ id: "web", engine: "exa", max_results: 6 }],
    messages: [{ role: "user", content: `List the most relevant official documentation pages for: ${query}` }],
    max_tokens: 600,
  });
  const notes = (json.choices?.[0]?.message?.annotations ?? []) as {
    type: string;
    url_citation?: { url: string; title?: string; content?: string };
  }[];
  return notes
    .filter((a) => a.type === "url_citation" && a.url_citation?.url)
    .map((a) => ({ url: a.url_citation!.url, title: a.url_citation!.title ?? "", snippet: (a.url_citation!.content ?? "").slice(0, 500) }));
}
