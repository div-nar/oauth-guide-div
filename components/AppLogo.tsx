"use client";

import { useState } from "react";

function hostOf(website: string): string {
  try {
    return new URL(website.startsWith("http") ? website : `https://${website}`).hostname;
  } catch {
    return website;
  }
}

// Vector tiles in public/logos (Simple Icons marks, CC0) for the apps and agents we show
// most; favicons are often 32px and blur when scaled up.
const BUNDLED: Record<string, string> = {
  github: "github", slack: "slack", gmail: "gmail", hubspot: "hubspot", linkedin: "linkedin",
  zoom: "zoom", calendly: "calendly", "claude code": "claude", claude: "claude", cursor: "cursor",
  codex: "openai", openai: "openai", chatgpt: "openai", gemini: "gemini",
};

export function AppLogo({ name, website, logoUrl, size = 40 }: { name: string; website: string; logoUrl?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const bundled = BUNDLED[name.toLowerCase()];
  const src = bundled ? `/logos/${bundled}.svg` : (logoUrl ?? `https://www.google.com/s2/favicons?domain=${hostOf(website)}&sz=128`);
  if (failed) {
    return (
      <span className="logo logo-fallback" style={{ width: size, height: size, fontSize: size * 0.45 }} aria-hidden>
        {name.charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={bundled ? "logo" : "logo logo-fetched"} src={src} alt="" width={size} height={size} onError={() => setFailed(true)} />
  );
}
