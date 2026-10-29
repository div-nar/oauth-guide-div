const ALIASES: Record<string, string> = {
  "google-mail": "gmail",
  "mail-google": "gmail",
  googlemail: "gmail",
  "github-com": "github",
  "linked-in": "linkedin",
  "hub-spot": "hubspot",
};

// Second-level labels that sit under a country TLD (zoho.co.uk, xero.com.au).
const SECOND_LEVEL = new Set(["co", "com", "org", "net", "gov", "ac"]);
const HOST_PREFIXES = new Set(["www", "app", "api", "developer", "developers", "docs", "login", "auth"]);

function brandFromHost(host: string): string {
  const labels = host.toLowerCase().split(".").filter(Boolean);
  if (labels.length >= 2 && labels[0] === "mail" && labels[1] === "google") return "gmail";
  while (labels.length > 2 && HOST_PREFIXES.has(labels[0])) labels.shift();
  // Drop the TLD, then any second-level label like the "co" in co.uk.
  labels.pop();
  if (labels.length > 1 && SECOND_LEVEL.has(labels[labels.length - 1])) labels.pop();
  return labels[labels.length - 1] ?? host;
}

export function resolveSlug(query: string): string {
  const q = query.trim().toLowerCase();
  const looksLikeUrl = /^https?:\/\//.test(q) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/.test(q);
  let base = q;
  if (looksLikeUrl) {
    const host = q.replace(/^https?:\/\//, "").split(/[/?#]/)[0];
    base = brandFromHost(host);
  }
  const slug = base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return ALIASES[slug] ?? slug;
}
