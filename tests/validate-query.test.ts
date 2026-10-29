import { describe, expect, test } from "bun:test";
import { validateQuery } from "@/lib/validate-query";

describe("validateQuery", () => {
  test("rejects empty and whitespace", () => {
    expect(validateQuery("").ok).toBe(false);
    expect(validateQuery("   ").ok).toBe(false);
  });

  test("rejects over 200 characters", () => {
    expect(validateQuery("a".repeat(201)).ok).toBe(false);
  });

  test("rejects non-web URL schemes", () => {
    expect(validateQuery("javascript:alert(1)").ok).toBe(false);
    expect(validateQuery("file:///etc/passwd").ok).toBe(false);
  });

  test("accepts app names and websites, trimmed", () => {
    expect(validateQuery("  Zoom ")).toEqual({ ok: true, value: "Zoom" });
    expect(validateQuery("https://calendly.com")).toEqual({ ok: true, value: "https://calendly.com" });
  });

  test("rejects input with no letters or digits", () => {
    expect(validateQuery("!!!").ok).toBe(false);
  });
});
