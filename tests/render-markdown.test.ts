import { describe, expect, test } from "bun:test";
import { guideToMarkdown } from "@/lib/render-markdown";
import { getLibraryGuide } from "@/lib/library";

const gmail = getLibraryGuide("gmail")!;
const md = guideToMarkdown(gmail, "https://example.test");

describe("guideToMarkdown", () => {
  test("contains the verdict line", () => {
    expect(md).toContain("Difficulty: hard");
    expect(md).toContain(gmail.verdict.summary);
  });

  test("prefixes every step with its owner tag", () => {
    for (const s of gmail.steps) {
      const tag = { agent: "[AGENT]", human: "[YOU]", waiting: "[WAIT]" }[s.owner];
      expect(md).toContain(`${tag} ${s.title}`);
    }
  });

  test("lists every source URL", () => {
    const urls = gmail.steps.flatMap((s) => s.evidence.sources.map((x) => x.url));
    for (const u of urls) expect(md).toContain(u);
  });

  test("includes the last checked date and the canonical URL", () => {
    expect(md).toContain("2026-10-28");
    expect(md).toContain("https://example.test/guides/gmail");
  });

  test("lists each use case with its difficulty", () => {
    for (const u of gmail.useCases) expect(md).toContain(`${u.label}: ${u.difficulty}`);
  });

  test("prints direct links and marks pre-filled ones", () => {
    const slack = guideToMarkdown(getLibraryGuide("slack")!, "https://example.test");
    expect(slack).toContain("(pre-filled)");
  });
});

describe("blockers", () => {
  test("every library guide has at least two sourced blockers", async () => {
    const { listLibraryGuides } = await import("@/lib/library");
    for (const g of listLibraryGuides()) {
      expect(g.blockers?.length ?? 0).toBeGreaterThanOrEqual(2);
      for (const b of g.blockers ?? []) expect(b.evidence.level).not.toBe("tested");
    }
  });

  test("markdown has a blocked section with the fix and escalation link", () => {
    const b = gmail.blockers![0];
    expect(md).toContain("## If you get blocked or rejected");
    expect(md).toContain(b.fix);
    if (b.escalate) expect(md).toContain(b.escalate.url);
  });

  test("blockers are filtered by the selected access", () => {
    const g = getLibraryGuide("slack")!;
    const onlyRead = g.blockers!.find((b) => b.useCaseIds?.length && !b.useCaseIds.includes("post"));
    expect(onlyRead).toBeDefined();
    expect(guideToMarkdown(g, "https://example.test", { ids: ["post"], existing: false })).not.toContain(onlyRead!.symptom);
  });
});
