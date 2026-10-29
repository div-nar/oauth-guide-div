import { query } from "@/lib/db";
import { type Guide, parseStoredGuide } from "@/lib/guide-schema";
import { getLibraryGuide, listLibraryGuides } from "@/lib/library";

export async function getGuide(slug: string): Promise<Guide | null> {
  const lib = getLibraryGuide(slug);
  if (lib) return lib;
  const rows = await query<{ guide: unknown }>("SELECT guide FROM guides WHERE slug = $1", [slug]);
  if (rows[0]) return parseStoredGuide(rows[0].guide);
  // A name that was researched but saved under an existing guide's slug (one app, one
  // guide): follow the finished run to that guide, so fetching it again never starts
  // another run.
  const [run] = await query<{ events: { type: string; slug?: string }[] }>(
    "SELECT events FROM generations WHERE slug = $1 AND status = 'done' ORDER BY id DESC LIMIT 1",
    [slug],
  );
  const saved = run?.events.find((e) => e.type === "done")?.slug;
  return saved && saved !== slug ? getGuide(saved) : null;
}

export async function saveGuide(g: Guide, q: string): Promise<void> {
  await query(
    `INSERT INTO guides (slug, query, guide) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET guide = EXCLUDED.guide, query = EXCLUDED.query, created_at = now()`,
    [g.slug, q, JSON.stringify(g)],
  );
}

// One app, one guide. Two guides are the same app when they name the same website
// (host and path, so products sharing a docs host stay apart) and one name contains
// the other once filler words are dropped ("Hinge" and "Hinge Dating App").
export function appKey(website: string): string {
  try {
    const u = new URL(website.startsWith("http") ? website : `https://${website}`);
    return (u.hostname.toLowerCase().replace(/^www\./, "") + u.pathname.toLowerCase()).replace(/\/+$/, "");
  } catch {
    return website.toLowerCase().replace(/\/+$/, "");
  }
}

const FILLER = new Set(["app", "apps", "api", "apis", "developer", "developers", "platform", "oauth", "setup", "the", "for", "and"]);
const words = (name: string) => name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !FILLER.has(w));

export function sameApp(a: Pick<Guide, "app">, b: Pick<Guide, "app">): boolean {
  if (appKey(a.app.website) !== appKey(b.app.website)) return false;
  const [x, y] = [words(a.app.name), words(b.app.name)];
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.length > 0 && short.every((w) => long.includes(w));
}

// Newest first, one per app, and none that repeat a hand-checked guide.
export function oneGuidePerApp(newestFirst: Guide[], library: Guide[]): Guide[] {
  const out: Guide[] = [];
  for (const g of newestFirst) {
    if (library.some((l) => l.slug === g.slug || sameApp(l, g))) continue;
    if (out.some((k) => sameApp(k, g))) continue;
    out.push(g);
  }
  return out;
}

export async function listGeneratedGuides(limit = 12): Promise<Guide[]> {
  const rows = await query<{ guide: unknown }>("SELECT guide FROM guides ORDER BY created_at DESC LIMIT $1", [limit * 3]);
  return oneGuidePerApp(rows.map((r) => parseStoredGuide(r.guide)), listLibraryGuides()).slice(0, limit);
}

// Where a newly researched guide belongs: its own slug when that guide already exists
// (a re-check), else the existing guide for the same app (a hand-checked one wins), so
// a second name for an app refreshes its guide instead of adding another.
export async function slugForApp(g: Guide): Promise<string> {
  const lib = listLibraryGuides().find((x) => sameApp(x, g));
  if (lib) return lib.slug;
  const rows = await query<{ guide: unknown }>("SELECT guide FROM guides ORDER BY created_at DESC LIMIT 500");
  const stored = rows.map((r) => parseStoredGuide(r.guide));
  if (stored.some((x) => x.slug === g.slug)) return g.slug;
  return stored.find((x) => sameApp(x, g))?.slug ?? g.slug;
}
