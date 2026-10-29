import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import path from "node:path";
import { getLibraryGuide, listLibraryGuides } from "@/lib/library";

const dir = path.join(import.meta.dir, "..", "data", "guides");

describe("library", () => {
  test("every library file parses", () => {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThanOrEqual(5);
    expect(listLibraryGuides().length).toBe(files.length);
  });

  test("slugs are unique and match filenames", () => {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      expect(getLibraryGuide(f.replace(/\.json$/, ""))?.slug).toBe(f.replace(/\.json$/, ""));
    }
    const slugs = listLibraryGuides().map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("each guide has at least one sourced or tested step", () => {
    for (const g of listLibraryGuides()) {
      expect(g.steps.some((s) => s.evidence.level !== "uncertain")).toBe(true);
    }
  });

  test("use-case difficulties across the library cover at least easy, hard and gated", () => {
    const d = new Set(listLibraryGuides().flatMap((g) => g.useCases.map((u) => u.difficulty)));
    for (const want of ["easy", "hard", "gated"]) expect(d.has(want as never)).toBe(true);
  });

  test("every agent or human step has a direct link", () => {
    for (const g of listLibraryGuides()) {
      for (const s of g.steps.filter((x) => x.owner !== "waiting")) {
        expect(s.link?.url, `${g.slug}/${s.id}`).toMatch(/^https:\/\//);
      }
    }
  });

  test("the headline verdict matches one of the guide's use cases", () => {
    for (const g of listLibraryGuides()) {
      expect(g.useCases.map((u) => u.difficulty)).toContain(g.verdict.difficulty);
    }
  });

  test("slack's create-app link is a pre-filled manifest with permissions and no redirect URI to edit out", () => {
    const step = getLibraryGuide("slack")!.steps.find((s) => s.link?.prefilled)!;
    const url = new URL(step.link!.url);
    expect(url.origin + url.pathname).toBe("https://api.slack.com/apps");
    const manifest = JSON.parse(url.searchParams.get("manifest_json")!);
    expect(manifest.oauth_config.scopes.bot).toContain("chat:write");
    expect(manifest.oauth_config.redirect_urls).toBeUndefined();
  });

  test("Composio appears only in the managed-app offer, never in the setup", () => {
    for (const g of listLibraryGuides()) {
      const setup = JSON.stringify(g, (k, v) => (k === "composio" || k === "checks" ? undefined : v));
      expect(setup.toLowerCase(), g.slug).not.toContain("composio");
    }
  });

  test("unknown slug returns null", () => {
    expect(getLibraryGuide("does-not-exist")).toBeNull();
  });
});
