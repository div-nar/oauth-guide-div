import { query } from "@/lib/db";
import { type Guide, parseStoredGuide } from "@/lib/guide-schema";
import { getLibraryGuide, listLibraryGuides } from "@/lib/library";

export async function getGuide(slug: string): Promise<Guide | null> {
  const lib = getLibraryGuide(slug);
  if (lib) return lib;
  const rows = await query<{ guide: unknown }>("SELECT guide FROM guides WHERE slug = $1", [slug]);
  return rows[0] ? parseStoredGuide(rows[0].guide) : null;
}

export async function saveGuide(g: Guide, q: string): Promise<void> {
  await query(
    `INSERT INTO guides (slug, query, guide) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET guide = EXCLUDED.guide, query = EXCLUDED.query, created_at = now()`,
    [g.slug, q, JSON.stringify(g)],
  );
}

// One app, one guide: the website identifies the app, whatever name was typed.
export function appKey(website: string): string {
  try {
    return new URL(website.startsWith("http") ? website : `https://${website}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return website.toLowerCase();
  }
}

// Newest first, one per website, and none that repeat a hand-checked guide.
export function oneGuidePerApp(newestFirst: Guide[], library: Guide[]): Guide[] {
  const seen = new Set(library.flatMap((g) => [g.slug, appKey(g.app.website)]));
  const out: Guide[] = [];
  for (const g of newestFirst) {
    const key = appKey(g.app.website);
    if (seen.has(g.slug) || seen.has(key)) continue;
    seen.add(key);
    out.push(g);
  }
  return out;
}

export async function listGeneratedGuides(limit = 12): Promise<Guide[]> {
  const rows = await query<{ guide: unknown }>("SELECT guide FROM guides ORDER BY created_at DESC LIMIT $1", [limit * 3]);
  return oneGuidePerApp(rows.map((r) => parseStoredGuide(r.guide)), listLibraryGuides()).slice(0, limit);
}

// Where a newly researched guide belongs: the slug of the existing guide for the same
// website (a hand-checked one wins), so a second name for an app refreshes its guide
// instead of adding another.
export async function slugForApp(g: Guide): Promise<string> {
  const key = appKey(g.app.website);
  const lib = listLibraryGuides().find((x) => appKey(x.app.website) === key);
  if (lib) return lib.slug;
  const rows = await query<{ guide: unknown }>("SELECT guide FROM guides ORDER BY created_at DESC LIMIT 500");
  const same = rows.map((r) => parseStoredGuide(r.guide)).find((x) => appKey(x.app.website) === key);
  return same?.slug ?? g.slug;
}
