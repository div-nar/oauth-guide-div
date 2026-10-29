import { after } from "next/server";
import { disambiguate, type Option } from "@/lib/agent/disambiguate";
import type { AgentEvent } from "@/lib/agent/events";
import { runChecks } from "@/lib/agent/checks";
import { runGuideAgent } from "@/lib/agent/run";
import { query } from "@/lib/db";
import { getGuide, saveGuide } from "@/lib/guides";
import { getLibraryGuide } from "@/lib/library";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveSlug } from "@/lib/slug";
import { validateQuery } from "@/lib/validate-query";

export type TimedEvent = AgentEvent & { t: number };
export type Job = {
  id: number;
  query: string;
  slug: string;
  status: "started" | "done" | "failed";
  events: TimedEvent[];
  startedAt: string;
  finishedAt: string | null;
};

export type StartResult =
  | { kind: "ready"; slug: string }
  | { kind: "ambiguous"; options: Option[] }
  | { kind: "job"; job: Pick<Job, "id" | "slug" | "query"> }
  | { kind: "rejected"; reason: string; status: number };

// A run that has not finished after this long is treated as dead (server restart, crash).
const STALE_MINUTES = 6;

async function appendEvent(id: number, startedMs: number, e: AgentEvent) {
  const ev = { ...e, t: Date.now() - startedMs };
  await query("UPDATE generations SET events = events || $2::jsonb WHERE id = $1", [id, JSON.stringify([ev])]);
}

async function runJob(id: number, q: string) {
  const started = Date.now();
  const emit = (e: AgentEvent) => void appendEvent(id, started, e).catch(() => {});
  try {
    await appendEvent(id, started, { type: "status", text: `Researching ${q}` });
    const researched = await runGuideAgent(q, emit);
    // A failed check run never loses the guide; it is saved without checks.
    const checks = await runChecks(researched, emit).catch((err) => {
      console.error("checks failed", id, err);
      return null;
    });
    const guide = { ...researched, checks };
    await saveGuide(guide, q);
    await appendEvent(id, started, { type: "done", slug: guide.slug });
    await query("UPDATE generations SET status = 'done', finished_at = now() WHERE id = $1", [id]);
  } catch (err) {
    console.error("research job failed", id, err);
    const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
    await appendEvent(id, started, { type: "error", message }).catch(() => {});
    await query("UPDATE generations SET status = 'failed', finished_at = now() WHERE id = $1", [id]).catch(() => {});
  }
}

// Starts research in the background (or reuses a running job for the same app).
// exact: the name was already chosen from a list, skip the ambiguity check.
// refresh: research again even though a guide exists (replaces it when done).
export async function startResearch(
  rawQuery: string,
  ip: string,
  opts: { exact?: boolean; refresh?: boolean } = {},
): Promise<StartResult> {
  const check = validateQuery(rawQuery);
  if (!check.ok) return { kind: "rejected", reason: check.reason, status: 400 };
  const q = check.value;
  const slug = resolveSlug(q);
  // Hand-checked guides are never overwritten by a refresh (the library copy always wins).
  if (getLibraryGuide(slug)) return { kind: "ready", slug };
  if (!opts.refresh && (await getGuide(slug))) return { kind: "ready", slug };

  const [running] = await query<{ id: number; query: string }>(
    `SELECT id, query FROM generations
      WHERE slug = $1 AND status = 'started' AND created_at > now() - make_interval(mins => $2)
      ORDER BY id DESC LIMIT 1`,
    [slug, STALE_MINUTES],
  );
  if (running) return { kind: "job", job: { id: running.id, slug, query: running.query } };

  // Rate limit before any model call, including the name check.
  const limit = await checkRateLimit(ip, new Date());
  if (!limit.allowed) return { kind: "rejected", reason: limit.reason!, status: 429 };

  if (!opts.exact && !opts.refresh) {
    const d = await disambiguate(q);
    if (d.ambiguous) return { kind: "ambiguous", options: d.options };
  }

  const [row] = await query<{ id: number }>(
    "INSERT INTO generations (ip, query, slug) VALUES ($1, $2, $3) RETURNING id",
    [ip, q, slug],
  );
  after(() => runJob(row.id, q));
  return { kind: "job", job: { id: row.id, slug, query: q } };
}

export async function getJob(id: number): Promise<Job | null> {
  const [r] = await query<{
    id: number;
    query: string;
    slug: string;
    status: Job["status"];
    events: TimedEvent[];
    created_at: Date;
    finished_at: Date | null;
    stale: boolean;
  }>(
    `SELECT id, query, slug, status, events, created_at, finished_at,
            (status = 'started' AND created_at < now() - make_interval(mins => $2)) AS stale
       FROM generations WHERE id = $1`,
    [id, STALE_MINUTES],
  );
  if (!r) return null;
  const events = r.stale ? [...r.events, { type: "error" as const, message: "Research stopped unexpectedly. Try again.", t: 0 }] : r.events;
  return {
    id: r.id,
    query: r.query,
    slug: r.slug,
    status: r.stale ? "failed" : r.status,
    events,
    startedAt: r.created_at.toISOString(),
    finishedAt: r.finished_at?.toISOString() ?? null,
  };
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
}
