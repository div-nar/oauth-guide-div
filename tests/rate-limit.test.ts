import { describe, expect, test } from "bun:test";
import { checkRateLimit } from "@/lib/rate-limit";

const caps = { perIpHourly: 3, daily: 50 };
const counts = (ipHour: number, day: number) => async () => ({ ipHour, day });

describe("checkRateLimit", () => {
  test("allows the 3rd request in an hour from one IP", async () => {
    expect((await checkRateLimit("1.1.1.1", new Date(), caps, counts(2, 10))).allowed).toBe(true);
  });

  test("denies the 4th request in an hour from one IP", async () => {
    const r = await checkRateLimit("1.1.1.1", new Date(), caps, counts(3, 10));
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain("hour");
  });

  test("denies any request past the daily cap", async () => {
    const r = await checkRateLimit("2.2.2.2", new Date(), caps, counts(0, 50));
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain("today");
  });
});
