import { describe, expect, test } from "bun:test";
import { composioLookup } from "@/lib/agent/composio";

const app = (name: string, slug: string) => ({ slug, app: { name, website: `https://${slug}.com` } });
const page = (status: number, text = "") => async () => ({ status, text });

describe("composioLookup", () => {
  test("a toolkit page with Composio-managed OAuth means Composio has its own app", async () => {
    const c = await composioLookup(app("Notion", "notion"), page(200, "Authentication Details Composio-managed OAuth available OAuth2"));
    expect(c?.managedApp).toBe("yes");
    expect(c?.evidence.sources[0].url).toBe("https://docs.composio.dev/toolkits/notion");
  });

  test("a toolkit page without it means bring your own app", async () => {
    expect((await composioLookup(app("Acme", "acme"), page(200, "Authentication Details OAuth2")))?.managedApp).toBe("no");
  });

  test("no toolkit page, or a failed fetch, records nothing", async () => {
    expect(await composioLookup(app("Hinge", "hinge"), page(404))).toBeNull();
    expect(await composioLookup(app("Hinge", "hinge"), async () => { throw new Error("offline"); })).toBeNull();
  });
});
