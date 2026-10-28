import type { Difficulty } from "@/lib/guide-schema";

// Log scale from 5 minutes to about 4 months, so minutes and months both read.
const MIN = Math.log10(5);
const MAX = Math.log10(120 * 24 * 60);

export function TimeBar({ minutes, waitDays, difficulty }: { minutes: number; waitDays: number; difficulty: Difficulty }) {
  const total = Math.max(5, minutes + waitDays * 24 * 60);
  const pct = Math.min(100, Math.max(4, ((Math.log10(total) - MIN) / (MAX - MIN)) * 100));
  return (
    <span className="timebar" aria-hidden>
      <span className={`timebar-fill ${difficulty}`} style={{ width: `${pct}%` }} />
    </span>
  );
}
