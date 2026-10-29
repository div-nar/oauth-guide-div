import { describe, expect, test } from "bun:test";
import { minimalGuide } from "./fixtures";
import { parseGuide } from "@/lib/guide-schema";
import { listLibraryGuides } from "@/lib/library";
import { appliesTo, combine, stepsFor } from "@/lib/paths";
import { getLibraryGuide as getLib } from "@/lib/library";
import { guideToMarkdown } from "@/lib/render-markdown";
import { handoffPrompt } from "@/lib/handoff";

const twoStep = () => {
  const g = minimalGuide();
  g.steps.push({ ...g.steps[0], id: "apply", title: "Apply for partner access" });
  g.useCases.push({ ...g.useCases[0], id: "partner", label: "Partner access", stepIds: ["create-app", "apply"] });
  g.useCases[0].stepIds = ["create-app"];
  return parseGuide(g);
};

describe("stepsFor", () => {
  test("returns only the steps a use case lists, in guide order", () => {
    const g = twoStep();
    expect(stepsFor(g, "default").map((s) => s.id)).toEqual(["create-app"]);
    expect(stepsFor(g, "partner").map((s) => s.id)).toEqual(["create-app", "apply"]);
  });

  test("an empty list means every step", () => {
    const g = twoStep();
    g.useCases[0].stepIds = [];
    expect(stepsFor(g, "default").length).toBe(2);
  });

  test("unknown use case or unknown step ids fall back safely", () => {
    const g = twoStep();
    expect(stepsFor(g, "nope").length).toBe(2);
    g.useCases[0].stepIds = ["ghost"];
    expect(stepsFor(g, "default").length).toBe(2);
  });
});

describe("library paths and edge cases", () => {
  test("every use case's step ids exist in its guide", () => {
    for (const g of listLibraryGuides()) {
      const ids = new Set(g.steps.map((s) => s.id));
      for (const u of g.useCases) for (const id of u.stepIds) expect(ids.has(id), `${g.slug}/${u.id}/${id}`).toBe(true);
    }
  });

  test("use cases with different difficulty have different paths", () => {
    for (const g of listLibraryGuides()) {
      const byDiff = new Map<string, string>();
      for (const u of g.useCases) {
        const key = stepsFor(g, u.id).map((s) => s.id).join(",");
        if (byDiff.has(u.difficulty)) continue;
        for (const [d, k] of byDiff) if (d !== u.difficulty) expect(k, `${g.slug}: ${u.id}`).not.toBe(key);
        byDiff.set(u.difficulty, key);
      }
    }
  });

  test("every library guide covers the 'already have an app' case and Composio's managed app", () => {
    for (const g of listLibraryGuides()) {
      expect(g.existingApp?.summary, g.slug).toBeTruthy();
      expect(g.existingApp!.reReviewTriggers.length, g.slug).toBeGreaterThan(0);
      expect(g.composio?.managedApp, g.slug).toBeDefined();
    }
  });
});

describe("combine (multi-select access)", () => {
  const build = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = minimalGuide() as any;
    g.steps[0].minutes = { min: 5, max: 10 } as never;
    g.steps.push({ ...g.steps[0], id: "apply", minutes: { min: 20, max: 40 } } as never);
    g.steps.push({ ...g.steps[0], id: "review", owner: "waiting", minutes: undefined, waitDays: { min: 7, max: 30 } } as never);
    g.useCases[0] = { ...g.useCases[0], id: "basic", difficulty: "easy", stepIds: ["create-app"], scopes: ["a"], waitDays: { min: 0, max: 0 } };
    g.useCases.push({ ...g.useCases[0], id: "partner", difficulty: "gated", stepIds: ["create-app", "apply", "review"], scopes: ["a", "b"], waitDays: { min: 7, max: 30 } });
    g.useCases.push({ ...g.useCases[0], id: "mid", difficulty: "hard", stepIds: ["create-app", "review"], scopes: ["c"], waitDays: { min: 3, max: 10 } });
    return parseGuide(g);
  };

  test("unions steps in guide order without duplicates", () => {
    expect(combine(build(), ["mid", "basic"]).steps.map((s) => s.id)).toEqual(["create-app", "review"]);
  });

  test("takes the hardest difficulty and the longest single wait", () => {
    const c = combine(build(), ["basic", "partner", "mid"]);
    expect(c.difficulty).toBe("gated");
    expect(c.waitDays).toEqual({ min: 7, max: 30 });
  });

  test("adds hands-on time from the combined steps, counting shared steps once", () => {
    expect(combine(build(), ["basic", "partner"]).handsOnMinutes).toEqual({ min: 25, max: 50 });
  });

  test("never reports less hands-on time than any single selected access", () => {
    const g = build();
    g.useCases[1].handsOnMinutes = { min: 60, max: 120 };
    expect(combine(g, ["basic", "partner"]).handsOnMinutes).toEqual({ min: 60, max: 120 });
  });

  test("merges scopes without duplicates", () => {
    expect(combine(build(), ["basic", "partner", "mid"]).scopes).toEqual(["a", "b", "c"]);
  });

  test("one selection returns that use case's own figures", () => {
    const g = build();
    const c = combine(g, ["partner"]);
    expect(c.handsOnMinutes).toEqual(g.useCases[1].handsOnMinutes);
    expect(c.summary).toBe(g.useCases[1].summary);
  });

  test("ignores unknown ids and falls back to the first use case when none are valid", () => {
    expect(combine(build(), ["ghost"]).ids).toEqual(["basic"]);
  });
});

describe("filtering by selected access", () => {
  test("an item with no use case ids applies to every path", () => {
    expect(appliesTo([], ["a"])).toBe(true);
  });
  test("an item applies when any selected access matches", () => {
    expect(appliesTo(["a", "b"], ["c", "b"])).toBe(true);
    expect(appliesTo(["a"], ["c"])).toBe(false);
  });
});

const getLibraryGuide = getLib;

describe("selection-aware markdown and hand-off", () => {
  test("markdown for a selection lists only that path's steps and people", () => {
    const g = getLibraryGuide("slack")!;
    const md = guideToMarkdown(g, "https://x.test", { ids: ["post"], existing: false });
    expect(md).toContain("Access: Post messages and replies");
    expect(md).not.toContain("Send the app to the Slack Marketplace");
    expect(md).not.toContain("10 or more real customer workspaces");
    expect(guideToMarkdown(g, "https://x.test")).toContain("Send the app to the Slack Marketplace");
  });

  test("markdown for an existing app lists re-review triggers instead of setup steps", () => {
    const md = guideToMarkdown(getLibraryGuide("gmail")!, "https://x.test", { ids: ["read"], existing: true });
    expect(md).toContain("What could send you back to review");
    expect(md).not.toContain("Create the OAuth client");
  });

  test("the hand-off prompt points the agent at the selected path", () => {
    const p = handoffPrompt(getLibraryGuide("linkedin")!, "https://x.test", { ids: ["member"], existing: false });
    expect(p).toContain("https://x.test/guides/linkedin.md?access=member");
  });
});
