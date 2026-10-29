"use client";

import { useState } from "react";
import { logoFor } from "@/lib/logos";

export function AppLogo({ name, website, logoUrl, size = 40 }: { name: string; website: string; logoUrl?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const { src, bundled } = logoFor({ name, website, logoUrl });
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
