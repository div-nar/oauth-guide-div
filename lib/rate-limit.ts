import { query } from "@/lib/db";

export type Caps = { perIpHourly: number; daily: number };
export type CountFn = (ip: string, now: Date) => Promise<{ ipHour: number; day: number }>;

export function capsFromEnv(): Caps {
  return {
    perIpHourly: Number(process.env.PER_IP_HOURLY_CAP ?? 3),
    daily: Number(process.env.DAILY_GENERATION_CAP ?? 50),
  };
}

const dbCounts: CountFn = async (ip, now) => {
  const hourAgo = new Date(now.getTime() - 3600_000);
  const dayAgo = new Date(now.getTime() - 86_400_000);
  const [row] = await query<{ ip_hour: string; day: string }>(
    `SELECT count(*) FILTER (WHERE ip = $1 AND created_at > $2) AS ip_hour,
            count(*) FILTER (WHERE created_at > $3) AS day
       FROM generations`,
    [ip, hourAgo, dayAgo],
  );
  return { ipHour: Number(row.ip_hour), day: Number(row.day) };
};

export async function checkRateLimit(
  ip: string,
  now: Date,
  caps: Caps = capsFromEnv(),
  counts: CountFn = dbCounts,
): Promise<{ allowed: boolean; reason?: string }> {
  const c = await counts(ip, now);
  if (c.day >= caps.daily) {
    return { allowed: false, reason: "The live agent has reached its limit for today. The checked guides still work." };
  }
  if (c.ipHour >= caps.perIpHourly) {
    return { allowed: false, reason: `You can generate ${caps.perIpHourly} new guides per hour. Try again later.` };
  }
  return { allowed: true };
}
