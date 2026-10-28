import { describe, expect, test } from "bun:test";
import { minimalGuide } from "./fixtures";
import { toAgentEvent } from "@/lib/agent/events";
import { runGuideAgent, type ModelCall } from "@/lib/agent/run";
import { toStrictSchema } from "@/lib/agent/strict-schema";
import { GuideSchema } from "@/lib/guide-schema";
import { z } from "zod";

type Block = Record<string, unknown>;
const msg = (content: Block[], stop_reason = "tool_use") => ({ content, stop_reason }) as never;
const submit = (input: unknown, id = "t1") => ({ type: "tool_use", id, name: "submit_guide", input });

function scripted(responses: ReturnType<typeof msg>[]): ModelCall & { calls: number } {
  const fn = (async (_params: unknown, onBlock: (b: unknown) => void) => {
    const r = responses[Math.min(fn.calls, responses.length - 1)] as { content: Block[] };
    fn.calls++;
    for (const b of r.content) onBlock(b as never);
    return r as never;
  }) as unknown as ModelCall & { calls: number };
  fn.calls = 0;
  return fn;
}

describe("toAgentEvent", () => {
  test("maps a web_search server_tool_use block to a search event", () => {
    expect(toAgentEvent({ type: "server_tool_use", name: "web_search", input: { query: "zoom oauth app" } } as never)).toEqual({
      type: "search",
      query: "zoom oauth app",
    });
  });

  test("maps a web_fetch block to a read event", () => {
    expect(toAgentEvent({ type: "server_tool_use", name: "web_fetch", input: { url: "https://x.test" } } as never)).toEqual({
      type: "read",
      url: "https://x.test",
    });
  });

  test("ignores thinking and tool result blocks", () => {
    expect(toAgentEvent({ type: "thinking", thinking: "" } as never)).toBeNull();
    expect(toAgentEvent({ type: "web_search_tool_result" } as never)).toBeNull();
  });
});

describe("runGuideAgent", () => {
  test("returns a parsed guide with our slug, date and generatedBy", async () => {
    const call = scripted([msg([submit(minimalGuide({ slug: "whatever", generatedBy: "library" }))])]);
    const g = await runGuideAgent("Acme", () => {}, { call, today: "2026-10-29" });
    expect(g.slug).toBe("acme");
    expect(g.generatedBy).toBe("agent");
    expect(g.lastChecked).toBe("2026-10-29");
  });

  test("downgrades any 'tested' evidence from the agent to 'sourced' or 'uncertain'", async () => {
    const bad = minimalGuide();
    bad.steps[0].evidence = { level: "tested", sources: [] } as never;
    const call = scripted([msg([submit(bad)])]);
    const g = await runGuideAgent("Acme", () => {}, { call, today: "2026-10-29" });
    expect(g.steps[0].evidence.level).toBe("uncertain");
  });

  test("a submit_guide input failing the schema twice yields an error and no guide", async () => {
    const call = scripted([msg([submit({ nope: true }, "a")]), msg([submit({ nope: true }, "b")])]);
    const events: string[] = [];
    await expect(runGuideAgent("Acme", (e) => events.push(e.type), { call, today: "2026-10-29" })).rejects.toThrow();
    expect(call.calls).toBe(2);
  });

  test("recovers when the first submission is invalid and the second is valid", async () => {
    const call = scripted([msg([submit({ nope: true }, "a")]), msg([submit(minimalGuide(), "b")])]);
    const g = await runGuideAgent("Acme", () => {}, { call, today: "2026-10-29" });
    expect(g.app.name).toBe("Acme");
  });

  test("resumes after pause_turn and gives up after too many", async () => {
    const paused = msg([{ type: "server_tool_use", name: "web_search", input: { query: "q" } }], "pause_turn");
    const call = scripted([paused]);
    await expect(runGuideAgent("Acme", () => {}, { call, today: "2026-10-29" })).rejects.toThrow(/too long/);
    expect(call.calls).toBe(5);
  });

  test("stops on a refusal", async () => {
    const call = scripted([msg([], "refusal")]);
    await expect(runGuideAgent("Acme", () => {}, { call, today: "2026-10-29" })).rejects.toThrow(/declined/);
  });

  test("emits search and read events as blocks arrive", async () => {
    const call = scripted([
      msg([
        { type: "server_tool_use", name: "web_search", input: { query: "acme oauth" } },
        submit(minimalGuide()),
      ]),
    ]);
    const events: string[] = [];
    await runGuideAgent("Acme", (e) => events.push(e.type), { call, today: "2026-10-29" });
    expect(events).toContain("search");
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
