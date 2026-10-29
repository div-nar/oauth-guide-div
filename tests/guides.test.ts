import { describe, expect, test } from "bun:test";
import { minimalGuide } from "./fixtures";
import { parseGuide } from "@/lib/guide-schema";
import { appKey, oneGuidePerApp, sameApp } from "@/lib/guides";
import { listLibraryGuides } from "@/lib/library";

const guide = (slug: string, name: string, website: string) => {
  const g = minimalGuide();
  return parseGuide({ ...g, slug, app: { ...g.app, name, website } });
};

describe("one guide per app", () => {
  test("the website key ignores www, case and a trailing slash, but keeps the path", () => {
    expect(appKey("https://hinge.co/")).toBe("hinge.co");
    expect(appKey("www.Hinge.co")).toBe("hinge.co");
    expect(appKey("https://developers.google.com/drive/")).toBe("developers.google.com/drive");
  });

  test("two names for one app are the same app", () => {
    expect(sameApp(guide("a", "Hinge", "https://hinge.co"), guide("b", "Hinge Dating App", "https://hinge.co/"))).toBe(true);
    expect(sameApp(guide("a", "Uber", "https://developer.uber.com/"), guide("b", "Uber Developer Platform", "https://developer.uber.com"))).toBe(true);
  });

  test("products sharing a docs site stay apart", () => {
    expect(sameApp(guide("a", "Google Drive", "https://developers.google.com"), guide("b", "Google Calendar", "https://developers.google.com"))).toBe(false);
    expect(sameApp(guide("a", "Jira", "https://developer.atlassian.com"), guide("b", "Confluence", "https://developer.atlassian.com"))).toBe(false);
    expect(sameApp(guide("a", "Google Drive", "https://developers.google.com/drive"), guide("b", "Google Drive", "https://developers.google.com/calendar"))).toBe(false);
  });

  test("keeps the newest guide for each app", () => {
    const newest = guide("hinge-dating-app-developer-oauth", "Hinge", "https://hinge.co");
    const older = guide("hinge-dating-app", "Hinge Dating App", "https://hinge.co/");
    const zoom = guide("zoom", "Zoom", "https://zoom.us");
    expect(oneGuidePerApp([newest, zoom, older], []).map((g) => g.slug)).toEqual(["hinge-dating-app-developer-oauth", "zoom"]);
  });

  test("never repeats a hand-checked guide", () => {
    expect(oneGuidePerApp([guide("github-oauth", "GitHub", "https://github.com/")], listLibraryGuides())).toEqual([]);
    expect(oneGuidePerApp([guide("gitlab", "GitLab", "https://gitlab.com")], listLibraryGuides()).length).toBe(1);
  });
});
