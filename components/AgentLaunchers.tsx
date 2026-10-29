"use client";

import { useState } from "react";
import { AppLogo } from "@/components/AppLogo";

// The agents the prompt works with, shown as a small overlapping stack inside the pill.
const AGENTS = [
  { name: "Claude Code", site: "claude.ai" },
  { name: "Cursor", site: "cursor.com" },
  { name: "Codex", site: "openai.com" },
];

export function AgentLaunchers({ prompt, label = "Copy setup prompt" }: { prompt: string; label?: string }) {
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied("done");
    } catch {
      // Some browsers block the clipboard; say so rather than doing nothing.
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), 2200);
  };
  const text = copied === "done" ? "Copied. Paste into your agent" : copied === "failed" ? "Couldn't copy. Try again" : label;
  return (
    <button type="button" className="setup-pill" onClick={copy} aria-label={text}>
      <span className="setup-pill-logos" aria-hidden>
        {AGENTS.map((a) => (
          <AppLogo key={a.name} name={a.name} website={a.site} size={18} />
        ))}
      </span>
      <span className="setup-pill-label" aria-live="polite">{text}</span>
      <span className="setup-pill-icon" aria-hidden>
        {copied === "done" ? (
          <svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24">
            <rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        )}
      </span>
    </button>
  );
}
