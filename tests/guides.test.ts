import { describe, expect, test } from "bun:test";
import { minimalGuide } from "./fixtures";
import { parseGuide } from "@/lib/guide-schema";
import { appKey, oneGuidePerApp } from "@/lib/guides";
import { listLibraryGuides } from "@/lib/library";

const guide = (slug: string, name: string, website: string) => {
  const g = minimalGuide();
  return parseGuide({ ...g, slug, app: { ...g.app, name, website } });
};

describe("one guide per app", () => {
  test("the website identifies the app, whatever was typed", () => {
    expect(appKey("https://hinge.co/")).toBe("hinge.co");
    expect(appKey("hinge.co")).toBe("hinge.co");
    expect(appKey("https://www.Hinge.co/app")).toBe("hinge.co");
  });

  test("keeps the newest guide for each website", () => {
    const newest = guide("hinge-dating-app-developer-oauth", "Hinge", "https://hinge.co");
    const older = guide("hinge-dating-app", "Hinge Dating App", "https://hinge.co/");
    const zoom = guide("zoom", "Zoom", "https://zoom.us");
    expect(oneGuidePerApp([newest, zoom, older], []).map((g) => g.slug)).toEqual(["hinge-dating-app-developer-oauth", "zoom"]);
  });

  test("never repeats a hand-checked guide", () => {
    const again = guide("google-mail", "Google Mail", "https://mail.google.com");
    expect(oneGuidePerApp([again], listLibraryGuides())).toEqual([]);
  });
});
