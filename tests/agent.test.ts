import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { minimalGuide } from "./fixtures";
import { type AgentDeps, type ChatMessage, runGuideAgent } from "@/lib/agent/run";
import { toStrictSchema } from "@/lib/agent/strict-schema";
import { AgentGuideSchema, GuideSchema } from "@/lib/guide-schema";

type ToolCall = { name: string; args: unknown; id?: string };
const turn = (calls: ToolCall[], finish = "tool_calls", content = "") => ({
  finish_reason: finish,
  message: {
    role: "assistant" as const,
    content,
    tool_calls: calls.map((c, i) => ({
      id: c.id ?? `call_${i}`,
      type: "function" as const,
      function: { name: c.name, arguments: JSON.stringify(c.args) },
    })),
  },
});

function deps(turns: ReturnType<typeof turn>[], extra: Partial<AgentDeps> = {}) {
  let n = 0;
  const bodies: ChatMessage[][] = [];
  const d = {
    chat: async (messages: ChatMessage[]) => {
      bodies.push([...messages]);
      return turns[Math.min(n++, turns.length - 1)];
    },
    search: async () => [{ url: "https://acme.example/docs", title: "Acme docs", snippet: "OAuth apps" }],
    fetchPage: async (url: string) => ({ url, text: "Acme OAuth docs page" }),
    today: "2026-10-29",
    ...extra,
    calls: () => n,
    bodies,
  };
  return d as AgentDeps & { calls: () => number; bodies: ChatMessage[][] };
}

const submit = (g: unknown) => turn([{ name: "submit_guide", args: g }]);

describe("runGuideAgent", () => {
  test("returns a parsed guide with our slug, date and generatedBy", async () => {
    const g = await runGuideAgent("Acme", () => {}, deps([submit(minimalGuide({ slug: "whatever", generatedBy: "library" }))]));
    expect(g.slug).toBe("acme");
    expect(g.generatedBy).toBe("agent");
    expect(g.lastChecked).toBe("2026-10-29");
  });

  test("runs search and page tools, emits events, and feeds results back", async () => {
    const d = deps([
      turn([{ name: "web_search", args: { query: "acme oauth" } }]),
      turn([{ name: "fetch_page", args: { url: "https://acme.example/docs" } }]),
      submit(minimalGuide()),
    ]);
    const events: string[] = [];
    await runGuideAgent("Acme", (e) => events.push(e.type), d);
    expect(events).toContain("search");
    expect(events).toContain("read");
    expect(d.bodies[2].some((m) => m.role === "tool" && String(m.content).includes("Acme OAuth docs page"))).toBe(true);
  });

  test("a submit_guide input failing the schema twice yields an error", async () => {
    const d = deps([submit({ nope: true })]);
    await expect(runGuideAgent("Acme", () => {}, d)).rejects.toThrow(/structure/);
    expect(d.calls()).toBe(2);
  });

  test("recovers when the first submission is invalid and the second is valid", async () => {
    const d = deps([submit({ nope: true }), submit(minimalGuide())]);
    expect((await runGuideAgent("Acme", () => {}, d)).app.name).toBe("Acme");
  });

  test("gives up after too many turns without submitting", async () => {
    const d = deps([turn([{ name: "web_search", args: { query: "q" } }])]);
    await expect(runGuideAgent("Acme", () => {}, d)).rejects.toThrow(/too long/);
  });

  test("stops when the response is cut off or filtered", async () => {
    await expect(runGuideAgent("Acme", () => {}, deps([turn([], "length")]))).rejects.toThrow(/too long to finish/);
    await expect(runGuideAgent("Acme", () => {}, deps([turn([], "content_filter")]))).rejects.toThrow(/declined/);
  });

  test("a failing page read is reported to the model, not thrown", async () => {
    const d = deps([turn([{ name: "fetch_page", args: { url: "https://acme.example/x" } }]), submit(minimalGuide())], {
      fetchPage: async () => {
        throw new Error("blocked address");
      },
    });
    await runGuideAgent("Acme", () => {}, d);
    expect(d.bodies[1].some((m) => m.role === "tool" && String(m.content).includes("blocked address"))).toBe(true);
  });

  test("never trusts 'tested' from the agent", async () => {
    const bad = minimalGuide();
    bad.steps[0].evidence = { level: "tested", sources: [] } as never;
    const g = await runGuideAgent("Acme", () => {}, deps([submit(bad)]));
    expect(g.steps[0].evidence.level).toBe("uncertain");
  });
});

describe("checks are code's, not the model's", () => {
  test("the submit tool asks for the sign-in endpoint but has no checks field", () => {
    const tools = JSON.stringify(z.toJSONSchema(AgentGuideSchema));
    expect(tools).toContain("authorizeUrl");
    expect(tools).not.toContain('"checks"');
  });

  test("checks the model submits anyway are dropped", async () => {
    const g = minimalGuide({ checks: { date: "2026-10-29", links: [{ kind: "link", url: "https://acme.example/apps/new", outcome: "ok", detail: "Page loads" }] } });
    expect((await runGuideAgent("Acme", () => {}, deps([submit(g)]))).checks).toBeNull();
  });
});

describe("repairs the model cannot see in the schema", () => {
  test("swaps reversed ranges and downgrades sourced claims with no sources instead of rejecting", async () => {
    const g = minimalGuide();
    (g.verdict as { handsOnMinutes: { min: number; max: number } }).handsOnMinutes = { min: 30, max: 10 };
    g.steps[0].evidence = { level: "sourced", sources: [] };
    const out = await runGuideAgent("Acme", () => {}, deps([submit(g)]));
    expect(out.verdict.handsOnMinutes).toEqual({ min: 10, max: 30 });
    expect(out.steps[0].evidence.level).toBe("uncertain");
  });
});

describe("link safety", () => {
  test("drops step links to hosts the agent never saw and that are not the app's own site", async () => {
    const g = minimalGuide();
    g.steps[0].link = { url: "https://evil.example/phish", label: "Create your app", prefilled: false };
    g.steps.push({ ...g.steps[0], id: "own", link: { url: "https://dashboard.acme.example/apps/new", label: "Open", prefilled: false } });
    g.steps.push({ ...g.steps[0], id: "seen", link: { url: "https://acme.example/docs", label: "Docs", prefilled: false } });
    g.steps.push({ ...g.steps[0], id: "composio", link: { url: "https://dashboard.composio.dev/~/project/auth-configs", label: "Composio", prefilled: false } });
    const out = await runGuideAgent("Acme", () => {}, deps([turn([{ name: "web_search", args: { query: "q" } }]), submit(g)]));
    const link = (id: string) => out.steps.find((s) => s.id === id)?.link?.url ?? null;
    expect(link("create-app")).toBeNull();
    expect(link("own")).toBe("https://dashboard.acme.example/apps/new");
    expect(link("seen")).toBe("https://acme.example/docs");
    expect(link("composio")).toBe("https://dashboard.composio.dev/~/project/auth-configs");
  });
});

describe("citation checking", () => {
  test("keeps sources the agent saw in search results or read, ignoring trailing slashes, www and fragments", async () => {
    const g = minimalGuide();
    g.steps[0].evidence = {
      level: "sourced",
      sources: [
        { url: "https://acme.example/docs/#scopes", title: "Docs" },
        { url: "https://www.acme.example/review", title: "Review" },
      ],
    };
    const d = deps([
      turn([
        { name: "web_search", args: { query: "q" } },
        { name: "fetch_page", args: { url: "https://acme.example/review" }, id: "c2" },
      ]),
      submit(g),
    ]);
    const out = await runGuideAgent("Acme", () => {}, d);
    expect(out.steps[0].evidence.sources.length).toBe(2);
    expect(out.steps[0].evidence.level).toBe("sourced");
  });

  test("drops a cited page the agent never saw and downgrades to uncertain when none remain", async () => {
    const g = minimalGuide();
    g.steps[0].evidence = { level: "sourced", sources: [{ url: "https://godocs.acme.example/made-up", title: "Invented" }] };
    const out = await runGuideAgent("Acme", () => {}, deps([submit(g)]));
    expect(out.steps[0].evidence.sources).toEqual([]);
    expect(out.steps[0].evidence.level).toBe("uncertain");
    expect(out.steps[0].evidence.note).toContain("did not open");
  });
});

describe("toStrictSchema", () => {
  test("every object lists all properties as required and forbids extras", () => {
    const s = toStrictSchema(z.toJSONSchema(GuideSchema) as Record<string, unknown>);
    const walk = (n: unknown): void => {
      if (!n || typeof n !== "object") return;
      const o = n as Record<string, unknown>;
      if (o.type === "object" && o.properties) {
        expect(o.additionalProperties).toBe(false);
        expect([...(o.required as string[])].sort()).toEqual(Object.keys(o.properties).sort());
      }
      expect(o.minimum).toBeUndefined();
      Object.values(o).forEach(walk);
    };
    walk(s);
  });
});
