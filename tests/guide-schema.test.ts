import { describe, expect, test } from "bun:test";
import { parseGuide } from "@/lib/guide-schema";

export function minimalGuide(overrides: Record<string, unknown> = {}) {
  return {
    slug: "acme",
    app: { name: "Acme", website: "https://acme.example" },
    lastChecked: "2026-10-28",
    generatedBy: "library",
    oauth: { supported: true },
    verdict: {
      difficulty: "easy",
      handsOnMinutes: { min: 5, max: 15 },
      waitDays: { min: 0, max: 0 },
      summary: "Self-serve form, no review.",
    },
    whoYouNeed: [],
    steps: [
      {
        id: "create-app",
        owner: "agent",
        title: "Create the OAuth app",
        plain: "Fill in the app's name and the address users return to.",
        evidence: { level: "sourced", sources: [{ url: "https://acme.example/docs", title: "Docs" }] },
      },
    ],
    forks: [],
    nuances: [],
    config: { scopes: [] },
    ...overrides,
  };
}

describe("GuideSchema", () => {
  test("parses a minimal valid guide", () => {
    expect(parseGuide(minimalGuide()).slug).toBe("acme");
  });

  test("rejects sourced evidence with no sources", () => {
    const g = minimalGuide();
    g.steps[0].evidence = { level: "sourced", sources: [] };
    expect(() => parseGuide(g)).toThrow();
  });

  test("accepts oauth.supported=false with difficulty not_applicable and zero steps", () => {
    const g = minimalGuide({
      oauth: { supported: false, notes: "Uses API keys only." },
      verdict: { difficulty: "not_applicable", handsOnMinutes: { min: 0, max: 0 }, waitDays: { min: 0, max: 0 }, summary: "No OAuth." },
      steps: [],
    });
    expect(parseGuide(g).oauth.supported).toBe(false);
  });

  test("rejects handsOnMinutes where min > max", () => {
    const g = minimalGuide({
      verdict: { difficulty: "easy", handsOnMinutes: { min: 20, max: 5 }, waitDays: { min: 0, max: 0 }, summary: "x" },
    });
    expect(() => parseGuide(g)).toThrow();
  });
});
