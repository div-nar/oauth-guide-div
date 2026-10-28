import { describe, expect, test } from "bun:test";
import { resolveSlug } from "@/lib/slug";

describe("resolveSlug", () => {
  test("different spellings of Gmail resolve to gmail", () => {
    for (const q of ["Gmail", "gmail", "Google Mail", "https://mail.google.com/x"]) {
      expect(resolveSlug(q)).toBe("gmail");
    }
  });

  test("a website resolves to its brand", () => {
    expect(resolveSlug("https://www.hubspot.com")).toBe("hubspot");
    expect(resolveSlug("calendly.com")).toBe("calendly");
  });

  test("trims and lowercases", () => {
    expect(resolveSlug("  Zoom  ")).toBe("zoom");
  });

  test("multi-word names become hyphenated", () => {
    expect(resolveSlug("Microsoft Teams")).toBe("microsoft-teams");
  });

  test("country TLDs and app subdomains collapse to the brand", () => {
    expect(resolveSlug("https://app.xero.com/login")).toBe("xero");
    expect(resolveSlug("www.zoho.co.uk")).toBe("zoho");
  });
});
