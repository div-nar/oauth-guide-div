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
});
