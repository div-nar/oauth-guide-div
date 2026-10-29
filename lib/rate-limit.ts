import { query } from "@/lib/db";

export type Caps = { daily: number };
export type CountFn = (now: Date) => Promise<{ day: number }>;

export function capsFromEnv(): Caps {
  return { daily: Number(process.env.DAILY_GENERATION_CAP ?? 15) };
}

const dbCounts: CountFn = async (now) => {
  const dayAgo = new Date(now.getTime() - 86_400_000);
  const [row] = await query<{ day: string }>("SELECT count(*) AS day FROM generations WHERE created_at > $1", [dayAgo]);
  return { day: Number(row.day) };
};

// One spend limit for everyone: research runs per day.
export async function checkRateLimit(
  now: Date,
  caps: Caps = capsFromEnv(),
  counts: CountFn = dbCounts,
): Promise<{ allowed: boolean; reason?: string }> {
  const c = await counts(now);
  if (c.day >= caps.daily) {
    return { allowed: false, reason: "The live agent has reached its limit for today. The checked guides still work." };
  }
  return { allowed: true };
}
