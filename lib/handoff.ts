import type { Guide } from "@/lib/guide-schema";
import { type Selection, selectionQuery } from "@/lib/paths";

export function handoffPrompt(g: Guide, baseUrl: string, sel?: Selection): string {
  const url = `${baseUrl}/guides/${g.slug}.md${sel ? selectionQuery(sel) : ""}`;
  return [
    `Help me set up my own ${g.app.name} OAuth app for my app.`,
    `Run: curl -s "${url}"`,
    "Follow that guide in order. Do the [AGENT] steps yourself.",
    "At each [YOU] step, stop, tell me exactly what to do, and wait for me to confirm.",
    "Never ask me to paste a client secret, password or token into this chat.",
  ].join(" ");
}

export function claudeCodeLink(prompt: string): string {
  return `claude-cli://open?q=${encodeURIComponent(prompt)}`;
}

export function cursorLink(prompt: string): string {
  return `cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(prompt)}`;
}
