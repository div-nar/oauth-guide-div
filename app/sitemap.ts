import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/base-url";
import { listGeneratedGuides } from "@/lib/guides";
import { listLibraryGuides } from "@/lib/library";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getBaseUrl();
  const generated = await listGeneratedGuides(50).catch(() => []);
  const guides = [...listLibraryGuides(), ...generated].map((g) => ({ url: `${base}/guides/${g.slug}`, lastModified: g.lastChecked }));
  return [{ url: base }, { url: `${base}/llms.txt` }, ...guides];
}
