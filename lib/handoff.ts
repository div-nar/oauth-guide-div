import type { Guide } from "@/lib/guide-schema";
import { type Selection, selectionQuery } from "@/lib/paths";

export function handoffPrompt(g: Guide, baseUrl: string, sel?: Selection): string {
  const url = `${baseUrl}/guides/${g.slug}.md${sel ? selectionQuery(sel) : ""}`;
  return [
    g.oauth.supported ? `Help me set up my own ${g.app.name} OAuth app for my app.` : `Help me set up ${g.app.name} API access for my app (it uses an API key, not OAuth).`,
    `Run: curl -s "${url}"`,
    "Follow that guide in order. Do the [AGENT] steps yourself.",
    "First, ask me for the exact callback URL of my app, including www and any trailing slash.",
    g.oauth.supported ? "Read the Protocol section before you write OAuth code." : "",
    "At each [YOU] step, stop, tell me exactly what to do, and wait for me to confirm.",
    "If a step fails, use the Troubleshooting section before you try anything else.",
    "Never ask me to paste a client secret, password or token into this chat.",
  ].filter(Boolean).join(" ");
}

export function claudeCodeLink(prompt: string): string {
  return `claude-cli://open?q=${encodeURIComponent(prompt)}`;
}

export function cursorLink(prompt: string): string {
  return `cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(prompt)}`;
}
