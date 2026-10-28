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

  test("difficulties across the library cover at least easy, hard and gated", () => {
    const d = new Set(listLibraryGuides().map((g) => g.verdict.difficulty));
    for (const want of ["easy", "hard", "gated"]) expect(d.has(want as never)).toBe(true);
  });

  test("unknown slug returns null", () => {
    expect(getLibraryGuide("does-not-exist")).toBeNull();
  });
});
