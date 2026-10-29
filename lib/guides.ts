import { query } from "@/lib/db";
import { type Guide, parseGuide } from "@/lib/guide-schema";
import { getLibraryGuide, listLibraryGuides } from "@/lib/library";

export async function getGuide(slug: string): Promise<Guide | null> {
  const lib = getLibraryGuide(slug);
  if (lib) return lib;
  const rows = await query<{ guide: unknown }>("SELECT guide FROM guides WHERE slug = $1", [slug]);
  return rows[0] ? parseGuide(rows[0].guide) : null;
}

export async function saveGuide(g: Guide, q: string): Promise<void> {
  await query(
    `INSERT INTO guides (slug, query, guide) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET guide = EXCLUDED.guide, query = EXCLUDED.query, created_at = now()`,
    [g.slug, q, JSON.stringify(g)],
  );
}

export async function listGeneratedGuides(limit = 12): Promise<Guide[]> {
  const libSlugs = new Set(listLibraryGuides().map((g) => g.slug));
  const rows = await query<{ guide: unknown }>("SELECT guide FROM guides ORDER BY created_at DESC LIMIT $1", [limit]);
  return rows.map((r) => parseGuide(r.guide)).filter((g) => !libSlugs.has(g.slug));
}
