import { describe, expect, test } from "bun:test";
import { claudeCodeLink, cursorLink, handoffPrompt } from "@/lib/handoff";
import { getLibraryGuide } from "@/lib/library";

const github = getLibraryGuide("github")!;
const prompt = handoffPrompt(github, "https://example.test");

describe("handoff", () => {
  test("prompt points the agent at the markdown guide", () => {
    expect(prompt).toContain("curl -s https://example.test/guides/github.md");
  });

  test("prompt tells the agent to stop at [YOU] steps and do [AGENT] steps", () => {
    expect(prompt).toContain("[AGENT]");
    expect(prompt).toContain("[YOU]");
    expect(prompt.toLowerCase()).toContain("stop");
  });

  test("claude code link round-trips the prompt", () => {
    const link = claudeCodeLink(prompt);
    expect(link.startsWith("claude-cli://open?q=")).toBe(true);
    expect(decodeURIComponent(link.slice("claude-cli://open?q=".length))).toBe(prompt);
  });

  test("cursor link round-trips the prompt", () => {
    const link = cursorLink(prompt);
    const prefix = "cursor://anysphere.cursor-deeplink/prompt?text=";
    expect(link.startsWith(prefix)).toBe(true);
    expect(decodeURIComponent(link.slice(prefix.length))).toBe(prompt);
  });
});
