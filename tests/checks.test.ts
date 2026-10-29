import { describe, expect, test } from "bun:test";
import { minimalGuide } from "./fixtures";
import { checkAuthorize, checkDiscovery, checkLink, excerpt, linkUrls, runChecks } from "@/lib/agent/checks";
import type { Probe } from "@/lib/agent/fetch-page";
import { parseGuide } from "@/lib/guide-schema";

type Reply = Partial<Probe> | Error;
// A fake network: each URL prefix maps to a reply; unknown URLs are a 404.
function net(replies: Record<string, Reply>) {
  const asked: string[] = [];
  const probe = async (url: string): Promise<Probe> => {
    asked.push(url);
    const key = Object.keys(replies).find((k) => url.startsWith(k));
    const r = key ? replies[key] : { status: 404 };
    if (r instanceof Error) throw r;
    return { status: 200, url, type: "text/html", body: "", ...r };
  };
  return { probe, asked };
}

describe("checkLink", () => {
  test("a page that loads is ok", async () => {
    const c = await checkLink("https://acme.example/apps", net({ "https://acme.example/apps": {} }).probe);
    expect(c).toMatchObject({ kind: "link", outcome: "ok", detail: "Page loads" });
  });

  test("a page that ends on a sign-in page needs sign-in", async () => {
    const { probe } = net({ "https://acme.example/apps": { url: "https://accounts.acme.example/signin?next=/apps" } });
    expect((await checkLink("https://acme.example/apps", probe)).outcome).toBe("sign_in");
    const { probe: p2 } = net({ "https://acme.example/settings": { url: "https://acme.example/login?return_to=/settings" } });
    expect((await checkLink("https://acme.example/settings", p2)).outcome).toBe("sign_in");
  });

  test("a link that is itself the sign-in page is ok", async () => {
    const c = await checkLink("https://acme.example/login", net({ "https://acme.example/login": {} }).probe);
    expect(c).toMatchObject({ outcome: "ok", detail: "Sign-in page loads" });
  });

  test("404 is broken; 403 and network errors are inconclusive, never broken", async () => {
    const { probe } = net({ "https://acme.example/blocked": { status: 403 }, "https://acme.example/down": new Error("timeout") });
    expect((await checkLink("https://acme.example/gone", probe)).outcome).toBe("broken");
    expect((await checkLink("https://acme.example/blocked", probe)).outcome).toBe("inconclusive");
    const down = await checkLink("https://acme.example/down", probe);
    expect(down.outcome).toBe("inconclusive");
    expect(down.detail).toContain("timeout");
  });
});

describe("checkAuthorize", () => {
  const auth = "https://acme.example/oauth/authorize";

  test("sends a made-up app ID with the guide's scopes", async () => {
    const n = net({ [auth]: { body: "<p>The OAuth client was not found.</p>" } });
    await checkAuthorize(auth, ["read", "write"], n.probe);
    const u = new URL(n.asked[0]);
    expect(u.searchParams.get("client_id")).toContain("not-a-real-app");
    expect(u.searchParams.get("scope")).toBe("read write");
  });

  test("a 'no such app' page confirms the endpoint, quoting the provider", async () => {
    const c = await checkAuthorize(auth, [], net({ [auth]: { body: "<h1>Access blocked</h1><p>The OAuth client was not found.</p>" } }).probe);
    expect(c.outcome).toBe("ok");
    expect(c.detail).toContain("The OAuth client was not found.");
  });

  test("our own client_id parameter in the address does not count as an answer", async () => {
    // Pages built in the browser come back empty; the echoed request must not match.
    const c = await checkAuthorize(auth, [], net({ [auth]: { body: "<div id=root></div>" } }).probe);
    expect(c.outcome).toBe("inconclusive");
  });

  test("an error the provider puts in the address counts", async () => {
    const { probe } = net({ [auth]: { url: "https://acme.example/oauth/error?error=invalid_client&error_description=Unknown+app" } });
    expect((await checkAuthorize(auth, [], probe)).outcome).toBe("ok");
  });

  test("an invalid scope answer is reported as such", async () => {
    const c = await checkAuthorize(auth, ["nope"], net({ [auth]: { body: "error: invalid_scope. The scope nope is unknown." } }).probe);
    expect(c.detail).toContain("permission");
  });

  test("being sent to sign in confirms the endpoint", async () => {
    const c = await checkAuthorize(auth, [], net({ [auth]: { url: "https://acme.example/login?return_to=%2Foauth%2Fauthorize" } }).probe);
    expect(c).toMatchObject({ outcome: "ok", detail: expect.stringContaining("sign in") });
  });

  test("404 is broken and 5xx inconclusive", async () => {
    expect((await checkAuthorize(auth, [], net({}).probe)).outcome).toBe("broken");
    expect((await checkAuthorize(auth, [], net({ [auth]: { status: 503 } }).probe)).outcome).toBe("inconclusive");
  });
});

describe("checkDiscovery", () => {
  const auth = "https://acme.example/oauth/authorize";
  const doc = (endpoint: string, scopes?: string[]) => ({
    body: JSON.stringify({ authorization_endpoint: endpoint, scopes_supported: scopes }),
  });

  test("a matching published endpoint is ok and counts known scopes", async () => {
    const { probe } = net({ "https://acme.example/.well-known/openid-configuration": doc(`${auth}/`, ["read", "openid"]) });
    const c = await checkDiscovery(auth, ["read", "write"], probe);
    expect(c?.outcome).toBe("ok");
    expect(c?.detail).toContain("1 of the guide's 2 permissions");
  });

  test("falls back to the OAuth server metadata address", async () => {
    const { probe } = net({ "https://acme.example/.well-known/oauth-authorization-server": doc(auth) });
    expect((await checkDiscovery(auth, [], probe))?.outcome).toBe("ok");
  });

  test("a different endpoint is inconclusive, not a failure", async () => {
    const { probe } = net({ "https://acme.example/.well-known/openid-configuration": doc("https://acme.example/openid/authorize") });
    expect((await checkDiscovery(auth, [], probe))?.outcome).toBe("inconclusive");
  });

  test("no published configuration gives no check", async () => {
    expect(await checkDiscovery(auth, [], net({ "https://acme.example/.well-known/openid-configuration": { body: "<html>" } }).probe)).toBeNull();
  });
});

describe("runChecks", () => {
  test("checks each distinct link once, including the console, and records the date", async () => {
    const g = parseGuide(
      minimalGuide({
        config: { consoleUrl: "https://acme.example/apps/new", authorizeUrl: "https://acme.example/oauth/authorize", scopes: [] },
      }),
    );
    g.steps.push({ ...g.steps[0], id: "two", link: { url: "https://acme.example/docs", label: "Docs", prefilled: false } });
    expect(linkUrls(g)).toEqual(["https://acme.example/apps/new", "https://acme.example/docs"]);
    const c = await runChecks(g, () => {}, { probe: net({ "https://acme.example/": {} }).probe, today: "2026-10-29" });
    expect(c.date).toBe("2026-10-29");
    expect(c.links.map((l) => l.outcome)).toEqual(["ok", "ok"]);
    expect(c.authorize).not.toBeNull();
  });

  test("skips the endpoint checks when the guide names no sign-in endpoint", async () => {
    const c = await runChecks(parseGuide(minimalGuide()), () => {}, { probe: net({}).probe });
    expect(c.authorize).toBeNull();
    expect(c.discovery).toBeNull();
  });

  test("never makes a request to a non-https link", async () => {
    const g = parseGuide(minimalGuide());
    g.steps[0].link = { url: "http://acme.example/apps", label: "x", prefilled: false };
    expect(linkUrls(g)).toEqual([]);
  });
});

describe("excerpt", () => {
  test("starts at the sentence around the match", () => {
    const t = "Sign in with Google  Access blocked: Authorization Error  The OAuth client was not found.  If you are a developer";
    expect(excerpt(t, t.indexOf("client was"))).toBe("Authorization Error The OAuth client was not found.");
  });

  test("strips markup and odd characters", () => {
    expect(excerpt('bad <b>client</b> "x" {}', 0)).toBe('bad client x');
  });
});
