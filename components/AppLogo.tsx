"use client";

import { useState } from "react";

function hostOf(website: string): string {
  try {
    return new URL(website.startsWith("http") ? website : `https://${website}`).hostname;
  } catch {
    return website;
  }
}

export function AppLogo({ name, website, logoUrl, size = 40 }: { name: string; website: string; logoUrl?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = logoUrl ?? `https://www.google.com/s2/favicons?domain=${hostOf(website)}&sz=128`;
  if (failed) {
    return (
      <span className="logo logo-fallback" style={{ width: size, height: size, fontSize: size * 0.45 }} aria-hidden>
        {name.charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="logo" src={src} alt="" width={size} height={size} onError={() => setFailed(true)} />
  );
}
