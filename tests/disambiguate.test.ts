import { describe, expect, test } from "bun:test";
import { disambiguate } from "@/lib/agent/disambiguate";

const reply = (obj: unknown) => async () => JSON.stringify(obj);

describe("disambiguate", () => {
  test("skips the model for website addresses", async () => {
    let called = false;
    const r = await disambiguate("https://zoom.us", async () => {
      called = true;
      return "{}";
    });
    expect(r.ambiguous).toBe(false);
    expect(called).toBe(false);
  });

  test("returns the options when the model finds several products", async () => {
    const r = await disambiguate("Teams", reply({
      ambiguous: true,
      options: [
        { name: "Microsoft Teams", query: "Microsoft Teams", description: "Chat and meetings in Microsoft 365" },
        { name: "Asana Teams", query: "Asana", description: "Teams in Asana" },
      ],
    }));
    expect(r.ambiguous).toBe(true);
    if (r.ambiguous) expect(r.options.map((o) => o.name)).toEqual(["Microsoft Teams", "Asana Teams"]);
  });

  test("treats a single option or unparseable output as not ambiguous", async () => {
    expect((await disambiguate("Zoom", reply({ ambiguous: true, options: [{ name: "Zoom", query: "Zoom", description: "" }] }))).ambiguous).toBe(false);
    expect((await disambiguate("Zoom", async () => "not json")).ambiguous).toBe(false);
  });

  test("never blocks research when the check itself fails", async () => {
    const r = await disambiguate("Zoom", async () => {
      throw new Error("provider down");
    });
    expect(r.ambiguous).toBe(false);
  });
});
