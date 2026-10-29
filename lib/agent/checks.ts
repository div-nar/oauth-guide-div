import type { AgentEvent } from "@/lib/agent/events";
import { htmlToText, type Probe } from "@/lib/agent/fetch-page";
import type { Check, Checks, Guide } from "@/lib/guide-schema";

// Checks code runs on a finished guide, with no accounts: do the step links load,
// does the sign-in endpoint answer, and does the provider publish a matching
// OAuth configuration. The results are labelled "Checked by the agent", never "Tested".

export type CheckDeps = {
  probe?: (url: string, opts?: { accept?: string; userAgent?: string; maxRedirects?: number }) => Promise<Probe>;
  today?: string;
};

const USER_AGENT = "Mozilla/5.0 (compatible; oauth-guides-checker/1.0)";
// Consoles bounce through several sign-in redirects before settling.
const MAX_REDIRECTS = 8;
const CONCURRENCY = 4;
// A made-up app ID, so the provider can only say the app does not exist.
const FAKE_CLIENT_ID = "oauth-guides-check-not-a-real-app";

const SIGN_IN_HOST = /^(accounts|login|signin|auth|sso|id)\./i;
const SIGN_IN_PATH = /\/(login|log-in|signin|sign-in|sign_in|session|sessions|sso|servicelogin|uas\/login)(\/|$|\?)/i;

export function looksLikeSignIn(u: string): boolean {
  try {
    const x = new URL(u);
    return SIGN_IN_HOST.test(x.hostname) || SIGN_IN_PATH.test(x.pathname);
  } catch {
    return false;
  }
}

const reason = (err: unknown) => (err instanceof Error ? err.message : String(err)).replace(/\.$/, "");

export async function checkLink(url: string, p: NonNullable<CheckDeps["probe"]>): Promise<Check> {
  const base = { kind: "link" as const, url };
  try {
    const res = await p(url, { userAgent: USER_AGENT, maxRedirects: MAX_REDIRECTS });
    if (res.status === 404 || res.status === 410) return { ...base, outcome: "broken", detail: `Page not found (HTTP ${res.status})` };
    if (res.status === 401) return { ...base, outcome: "sign_in", detail: "Loads, sign-in required" };
    if (res.status >= 200 && res.status < 300) {
      if (looksLikeSignIn(url)) return { ...base, outcome: "ok", detail: "Sign-in page loads" };
      if (looksLikeSignIn(res.url)) return { ...base, outcome: "sign_in", detail: "Loads, sign-in required" };
      return { ...base, outcome: "ok", detail: "Page loads" };
    }
    return { ...base, outcome: "inconclusive", detail: `The site did not answer an automated check clearly (HTTP ${res.status})` };
  } catch (err) {
    return { ...base, outcome: "inconclusive", detail: `Could not reach the page: ${reason(err)}` };
  }
}

// Provider text is untrusted: keep a short, plain excerpt only, from the start of
// the sentence around the match (or the nearest word) to its end.
export function excerpt(text: string, at: number): string {
  const from = Math.max(0, at - 60);
  let head = text.slice(from, at);
  const sentence = head.search(/[.!?:]\s[^.!?:]*$/);
  if (sentence >= 0) head = head.slice(sentence + 2);
  else if (from > 0) head = head.slice(head.indexOf(" ") + 1);
  let tail = text.slice(at, at + 100);
  const end = tail.search(/[.!?](\s|$)/);
  if (end >= 0) tail = tail.slice(0, end + 1);
  else if (at + 100 < text.length && tail.includes(" ")) tail = tail.slice(0, tail.lastIndexOf(" "));
  return (head + tail)
    .replace(/<[^>]*>/g, " ")
    .replace(/[^\w .,:'()/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CLIENT_ERROR = /invalid[_ ]client|client_id is invalid|client (was )?not found|unknown client|no such (client|app)|app(lication)? (was )?not found|invalid[_ ]request/i;
const SCOPE_ERROR = /invalid[_ ]scope/i;

export function authorizeProbeUrl(authorizeUrl: string, scopes: string[]): string {
  const u = new URL(authorizeUrl);
  u.searchParams.set("client_id", FAKE_CLIENT_ID);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", "https://example.com/callback");
  if (scopes.length) u.searchParams.set("scope", scopes.join(" "));
  return u.toString();
}

// Ask the sign-in endpoint to start a flow for an app that does not exist. Any
// "no such app" answer confirms the endpoint is real and live.
export async function checkAuthorize(authorizeUrl: string, scopes: string[], p: NonNullable<CheckDeps["probe"]>): Promise<Check> {
  const base = { kind: "authorize" as const, url: authorizeUrl };
  let target: string;
  try {
    target = authorizeProbeUrl(authorizeUrl, scopes);
  } catch {
    return { ...base, outcome: "inconclusive", detail: "The sign-in address in the guide is not a valid URL" };
  }
  try {
    const res = await p(target, { userAgent: USER_AGENT, maxRedirects: MAX_REDIRECTS });
    if (res.status === 404 || res.status === 410) return { ...base, outcome: "broken", detail: `Sign-in endpoint not found (HTTP ${res.status})` };
    if (res.status >= 500) return { ...base, outcome: "inconclusive", detail: `Sign-in endpoint returned a server error (HTTP ${res.status})` };
    // Only the page and any error the provider put in the address count: our own
    // request parameters (client_id=...) must not match.
    const errorParam = new URL(res.url).searchParams.get("error") ?? "";
    const text = `${errorParam} ${errorParam && new URL(res.url).searchParams.get("error_description")} ${htmlToText(res.body)}`;
    const scope = text.search(SCOPE_ERROR);
    if (scope >= 0) return { ...base, outcome: "ok", detail: `Sign-in endpoint answers and rejects a permission name: "${excerpt(text, scope)}"` };
    const client = text.search(CLIENT_ERROR);
    if (client >= 0) return { ...base, outcome: "ok", detail: `Sign-in endpoint answers and rejects a made-up app ID: "${excerpt(text, client)}"` };
    if (looksLikeSignIn(res.url)) return { ...base, outcome: "ok", detail: "Sign-in endpoint answers by asking the user to sign in first" };
    return { ...base, outcome: "inconclusive", detail: `Sign-in endpoint responds (HTTP ${res.status}) but gave no clear error for a made-up app` };
  } catch (err) {
    return { ...base, outcome: "inconclusive", detail: `Could not reach the sign-in endpoint: ${reason(err)}` };
  }
}

const sameEndpoint = (a: string, b: string) => {
  try {
    const x = new URL(a);
    const y = new URL(b);
    return x.host === y.host && x.pathname.replace(/\/+$/, "") === y.pathname.replace(/\/+$/, "");
  } catch {
    return false;
  }
};

// Many providers publish their OAuth endpoints at a well-known address. Returns
// null when there is none, which is common and says nothing about the guide.
export async function checkDiscovery(authorizeUrl: string, scopes: string[], p: NonNullable<CheckDeps["probe"]>): Promise<Check | null> {
  let origin: string;
  try {
    origin = new URL(authorizeUrl).origin;
  } catch {
    return null;
  }
  for (const path of ["/.well-known/openid-configuration", "/.well-known/oauth-authorization-server"]) {
    const url = origin + path;
    let doc: { authorization_endpoint?: unknown; scopes_supported?: unknown };
    try {
      const res = await p(url, { accept: "application/json", userAgent: USER_AGENT });
      if (res.status !== 200) continue;
      doc = JSON.parse(res.body);
    } catch {
      continue;
    }
    if (typeof doc.authorization_endpoint !== "string") continue;
    const listed = Array.isArray(doc.scopes_supported) ? new Set(doc.scopes_supported.map(String)) : null;
    const known = listed ? scopes.filter((s) => listed.has(s)) : [];
    const scopeNote = known.length ? ` It also lists ${known.length} of the guide's ${scopes.length} permissions.` : "";
    if (sameEndpoint(doc.authorization_endpoint, authorizeUrl)) {
      return { kind: "discovery", url, outcome: "ok", detail: `The provider's published OAuth configuration lists the same sign-in address.${scopeNote}` };
    }
    // Often a separate "Sign in with" (OpenID) flow, so not proof the guide is wrong.
    return {
      kind: "discovery",
      url,
      outcome: "inconclusive",
      detail: `The provider's published configuration names a different sign-in address (${excerpt(doc.authorization_endpoint, 0)}), possibly for a separate "Sign in with" flow.${scopeNote}`,
    };
  }
  return null;
}

async function inBatches<T, R>(xs: T[], n: number, f: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < xs.length; i += n) out.push(...(await Promise.all(xs.slice(i, i + n).map(f))));
  return out;
}

export function linkUrls(g: Guide): string[] {
  const steps = [...g.steps, ...(g.existingApp?.steps ?? [])];
  const urls = [g.config.consoleUrl, ...steps.map((s) => s.link?.url)].filter((u): u is string => !!u && u.startsWith("https://"));
  return [...new Set(urls)];
}

export async function runChecks(g: Guide, emit: (e: AgentEvent) => void = () => {}, deps: CheckDeps = {}): Promise<Checks> {
  const p = deps.probe ?? (await import("@/lib/agent/fetch-page")).probe;
  const urls = linkUrls(g);
  emit({ type: "status", text: `Checking that ${urls.length} step links load` });
  const links = await inBatches(urls, CONCURRENCY, (u) => checkLink(u, p));
  const count = (o: Check["outcome"]) => links.filter((l) => l.outcome === o).length;
  emit({
    type: "status",
    text: `Links: ${count("ok")} load, ${count("sign_in")} need sign-in, ${count("broken")} not found, ${count("inconclusive")} unclear`,
  });

  const scopes = g.config.scopes.map((s) => s.name);
  let authorize: Check | null = null;
  let discovery: Check | null = null;
  if (g.oauth.supported && g.config.authorizeUrl) {
    emit({ type: "status", text: "Asking the sign-in endpoint about a made-up app" });
    [authorize, discovery] = await Promise.all([
      checkAuthorize(g.config.authorizeUrl, scopes, p),
      checkDiscovery(g.config.authorizeUrl, scopes, p),
    ]);
  }
  return { date: deps.today ?? new Date().toISOString().slice(0, 10), links, authorize, discovery };
}
