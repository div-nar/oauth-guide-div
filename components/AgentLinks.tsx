"use client";

import { useState } from "react";

// Stripe-style shortcuts for people pasting a guide into an LLM themselves.
export function AgentLinks({ md, json }: { md: string; json: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    try {
      const text = await (await fetch(md)).text();
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 1800);
  };
  return (
    <p className="agent-links small">
      <button type="button" onClick={copy}>{state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy for LLM"}</button>
      <a href={md} target="_blank" rel="noreferrer">View as Markdown</a>
      <a href={json} target="_blank" rel="noreferrer">View as JSON</a>
    </p>
  );
}
