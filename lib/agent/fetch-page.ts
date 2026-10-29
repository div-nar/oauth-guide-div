import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 2_000_000;
const MAX_CHARS = 40_000;
const MAX_REDIRECTS = 3;

// URLs come from the model, which reads untrusted pages, so refuse anything
// that resolves to loopback, private, link-local or otherwise internal ranges.
export function isPrivateAddress(ip: string): boolean {
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  if (isIP(v4) === 4) {
    const [a, b] = v4.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const x = ip.toLowerCase();
  return x === "::" || x === "::1" || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe8") || x.startsWith("fe9") || x.startsWith("fea") || x.startsWith("feb");
}

async function assertPublic(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only http and https pages can be read.");
  const addrs = isIP(url.hostname) ? [{ address: url.hostname }] : await lookup(url.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) throw new Error("That address is not on the public internet.");
}

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

export type Probe = { status: number; url: string; type: string; body: string };

// Follows redirects (each hop must be public) and reports what came back without
// treating an error status as a failure. Network errors still throw.
export async function probe(raw: string, opts: { accept?: string; userAgent?: string; maxRedirects?: number } = {}): Promise<Probe> {
  let url = new URL(raw);
  for (let hop = 0; hop <= (opts.maxRedirects ?? MAX_REDIRECTS); hop++) {
    await assertPublic(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": opts.userAgent ?? "oauth-guides-research/1.0", accept: opts.accept ?? "text/html,text/plain,text/markdown" },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) throw new Error("The page is too large to read.");
    const body = (await res.text()).slice(0, MAX_BYTES);
    return { status: res.status, url: url.toString(), type: res.headers.get("content-type") ?? "", body };
  }
  throw new Error("Too many redirects.");
}

export async function fetchPage(raw: string): Promise<{ url: string; text: string }> {
  const res = await probe(raw);
  if (res.status < 200 || res.status >= 300) throw new Error(`The page returned HTTP ${res.status}.`);
  const text = res.type.includes("html") ? htmlToText(res.body) : res.body;
  return { url: res.url, text: text.slice(0, MAX_CHARS) };
}
