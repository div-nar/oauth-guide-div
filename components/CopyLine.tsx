"use client";

import { useState } from "react";

// The whole line is the copy target; the icon on the right shows what clicking does.
export function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="copy-line"
      aria-label={copied ? "Copied" : "Copy this prompt"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {}
      }}
    >
      <code>{text}</code>
      <span className="copy-icon" aria-hidden>
        {copied ? (
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
