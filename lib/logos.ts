// Vector tiles in public/logos (Simple Icons marks, CC0) for the apps and agents we show
// most; favicons are often 32px and blur when scaled up.
const BUNDLED: Record<string, string> = {
  github: "github", slack: "slack", gmail: "gmail", hubspot: "hubspot", linkedin: "linkedin",
  zoom: "zoom", calendly: "calendly", "claude code": "claude", claude: "claude", cursor: "cursor",
  codex: "openai", openai: "openai", chatgpt: "openai", gemini: "gemini",
};

export function bundledLogo(name: string): string | null {
  const k = BUNDLED[name.toLowerCase()];
  return k ? `/logos/${k}.svg` : null;
}

export function hostOf(website: string): string {
  try {
    return new URL(website.startsWith("http") ? website : `https://${website}`).hostname;
  } catch {
    return website;
  }
}

// The best image we have for an app: our tile, the guide's own logo, or its favicon.
export function logoFor(app: { name: string; website: string; logoUrl?: string | null }): { src: string; bundled: boolean } {
  const b = bundledLogo(app.name);
  if (b) return { src: b, bundled: true };
  return { src: app.logoUrl ?? `https://www.google.com/s2/favicons?domain=${hostOf(app.website)}&sz=128`, bundled: false };
}
