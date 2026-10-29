import { describe, expect, test } from "bun:test";
import { checkRateLimit } from "@/lib/rate-limit";

const caps = { daily: 50 };
const counts = (day: number) => async () => ({ day });

describe("checkRateLimit", () => {
  test("allows requests under the daily cap, however many one person makes", async () => {
    expect((await checkRateLimit(new Date(), caps, counts(49))).allowed).toBe(true);
  });

  test("denies any request past the daily cap", async () => {
    const r = await checkRateLimit(new Date(), caps, counts(50));
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain("today");
  });
});
