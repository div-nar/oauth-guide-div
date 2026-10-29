import { describe, expect, test } from "bun:test";
import { stepPoints } from "@/components/StepTimeline";

describe("stepPoints", () => {
  test("keeps at most two sentences as points and folds the rest", () => {
    const r = stepPoints("Open the page. Click Create. Copy the ID. Store it.");
    expect(r.points).toEqual(["Open the page.", "Click Create."]);
    expect(r.rest).toBe("Copy the ID. Store it.");
  });

  test("does not split inside a code name or a version number", () => {
    expect(stepPoints("Use `oauth.v2.access` with OAuth 2.0 here.").points).toHaveLength(1);
  });
});
