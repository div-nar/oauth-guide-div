import type { BetaContentBlock } from "@anthropic-ai/sdk/resources/beta/messages/messages";

export type AgentEvent =
  | { type: "status"; text: string }
  | { type: "search"; query: string }
  | { type: "read"; url: string }
  | { type: "done"; slug: string }
  | { type: "error"; message: string };

export function toAgentEvent(block: BetaContentBlock): AgentEvent | null {
  if (block.type === "server_tool_use") {
    const input = block.input as { query?: string; url?: string };
    if (block.name === "web_search" && input.query) return { type: "search", query: input.query };
    if (block.name === "web_fetch" && input.url) return { type: "read", url: input.url };
    return null;
  }
  if (block.type === "text" && block.text.trim()) {
    const text = block.text.trim();
    return { type: "status", text: text.length > 240 ? `${text.slice(0, 237)}...` : text };
  }
  return null;
}
