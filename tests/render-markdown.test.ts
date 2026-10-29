import { describe, expect, test } from "bun:test";
import { guideToMarkdown, OWNER_TAG } from "@/lib/render-markdown";
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

describe("composio managed app", () => {
  const slack = getLibraryGuide("slack")!;

  test("markdown offers Composio's app when the path has a wait", () => {
    const out = guideToMarkdown(slack, "https://example.test", { ids: ["read"], existing: false });
    expect(out).toContain("## Can't wait? Connect on Composio");
  });

  test("a limit for the selected access is shown with the offer", () => {
    const limit = slack.composio!.limits!.find((l) => l.useCaseIds.includes("read"))!;
    expect(limit.evidence.level).toBe("sourced");
    const out = guideToMarkdown(slack, "https://example.test", { ids: ["read"], existing: false });
    expect(out).toContain(limit.note);
  });

  test("no offer when the selected path has no wait", () => {
    const out = guideToMarkdown(slack, "https://example.test", { ids: ["post"], existing: false });
    expect(out).not.toContain("Connect on Composio");
  });
});

describe("agent structure", () => {
  test("sections follow the web page's order", () => {
    const order = ["## Can't wait? Connect on Composio", "## What you need", "## Steps", "## If you get blocked or rejected", "## Questions", "## Configuration"];
    const at = order.map((h) => md.indexOf(h));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  test("each kind of access names its id and the URL for just that path", () => {
    for (const u of gmail.useCases) {
      expect(md).toContain(`\`${u.id}\``);
      expect(md).toContain(`https://example.test/guides/gmail.md?access=${u.id}`);
    }
  });
});

describe("easier for agents", () => {
  test("without a chosen access, the agent is told to ask the user first", () => {
    expect(md).toContain("## First, ask the user");
    expect(md.indexOf("## First, ask the user")).toBeLessThan(md.indexOf("## Steps"));
  });

  test("with a chosen access, there is nothing to ask", () => {
    expect(guideToMarkdown(gmail, "https://example.test", { ids: ["send"], existing: false })).not.toContain("## First, ask the user");
  });

  test("steps are a checklist the agent can tick off", () => {
    expect(md).toContain(`- [ ] 1. ${OWNER_TAG[gmail.steps[0].owner]} ${gmail.steps[0].title}`);
  });
});

describe("checks by the agent", () => {
  test("a checked step link gets an Observed line, apart from its evidence", () => {
    const g = getLibraryGuide("github")!;
    const out = guideToMarkdown(g, "https://example.test");
    const linked = g.steps.find((st) => st.link && g.checks?.links.some((c) => c.url === st.link!.url))!;
    const block = out.slice(out.indexOf(`#step-${linked.id}`));
    expect(block.slice(0, block.indexOf("- [ ]") > 0 ? block.indexOf("- [ ]") : undefined)).toMatch(/Observed \(checked by the agent \d{4}-\d{2}-\d{2}\): /);
  });

  test("the configuration lists the sign-in endpoint and what it answered", () => {
    const out = guideToMarkdown(getLibraryGuide("gmail")!, "https://example.test");
    expect(out).toContain("- Sign-in (authorization) endpoint: https://accounts.google.com/o/oauth2/v2/auth");
    expect(out).toMatch(/- Observed \(checked by the agent [\d-]+\): Sign-in endpoint answers/);
  });

  test("a guide without checks has no Observed lines", () => {
    const g = { ...getLibraryGuide("github")!, checks: null };
    expect(guideToMarkdown(g, "https://example.test")).not.toContain("Observed");
  });
});
