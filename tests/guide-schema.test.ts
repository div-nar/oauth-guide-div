import { describe, expect, test } from "bun:test";
import { parseGuide, parseStoredGuide } from "@/lib/guide-schema";
import { minimalGuide } from "./fixtures";

describe("GuideSchema", () => {
  test("parses a minimal valid guide", () => {
    expect(parseGuide(minimalGuide()).slug).toBe("acme");
  });

  test("reads a stored guide saved before use cases had stepIds", () => {
    const g = minimalGuide() as { useCases: { stepIds?: string[] }[] };
    for (const u of g.useCases) delete u.stepIds;
    expect(() => parseGuide(g)).toThrow();
    expect(parseStoredGuide(g).useCases.every((u) => u.stepIds.length === 0)).toBe(true);
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

  test("requires at least one use case when OAuth is supported", () => {
    expect(() => parseGuide(minimalGuide({ useCases: [] }))).toThrow();
  });

  test("allows zero use cases when OAuth is not supported", () => {
    const g = minimalGuide({
      oauth: { supported: false },
      useCases: [],
      verdict: { difficulty: "not_applicable", handsOnMinutes: { min: 0, max: 0 }, waitDays: { min: 0, max: 0 }, summary: "No OAuth." },
      steps: [],
    });
    expect(parseGuide(g).useCases).toEqual([]);
  });

  test("keeps a step's direct link and its prefilled flag", () => {
    expect(parseGuide(minimalGuide()).steps[0].link?.prefilled).toBe(false);
  });
});
