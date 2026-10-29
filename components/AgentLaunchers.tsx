"use client";

import { useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { claudeCodeLink, cursorLink } from "@/lib/handoff";

type Agent = { name: string; site: string; action: string; href?: (p: string) => string };

const AGENTS: Agent[] = [
  { name: "Claude Code", site: "claude.ai", action: "Open in Claude Code", href: claudeCodeLink },
  { name: "Cursor", site: "cursor.com", action: "Open in Cursor", href: cursorLink },
  { name: "ChatGPT", site: "chatgpt.com", action: "Open in ChatGPT", href: (p) => `https://chatgpt.com/?q=${encodeURIComponent(p)}` },
  { name: "Codex", site: "openai.com", action: "Copy prompt for Codex" },
  { name: "Gemini", site: "gemini.google.com", action: "Copy prompt for Gemini" },
  { name: "Windsurf", site: "windsurf.com", action: "Copy prompt for Windsurf" },
];

export function AgentLaunchers({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(name);
      setTimeout(() => setCopied(null), 1800);
    } catch {}
  };
  return (
    <ul className="launchers">
      {AGENTS.map((a) => {
        const label = copied === a.name ? "Copied. Paste it into " + a.name : a.action;
        const inner = (
          <>
            <AppLogo name={a.name} website={a.site} size={30} />
            <span className="launcher-tip" role="tooltip">{label}</span>
          </>
        );
        return (
          <li key={a.name}>
            {a.href ? (
              <a className="launcher" href={a.href(prompt)} target={a.href(prompt).startsWith("http") ? "_blank" : undefined} rel="noreferrer" aria-label={a.action}>
                {inner}
              </a>
            ) : (
              <button type="button" className="launcher" onClick={() => copy(a.name)} aria-label={a.action}>
                {inner}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
