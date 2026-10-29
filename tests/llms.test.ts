import { describe, expect, test } from "bun:test";
import { buildIndex } from "@/lib/llms";

describe("llms.txt", () => {
  test("lists each guide's access ids and the JSON form", async () => {
    const txt = await buildIndex("https://example.test");
    expect(txt).toContain("access: `read`, `send`, `internal`");
    expect(txt).toContain("https://example.test/guides/<app-name>.json");
  });
});
