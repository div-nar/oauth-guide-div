export type QueryCheck = { ok: true; value: string } | { ok: false; reason: string };

export function validateQuery(q: string): QueryCheck {
  const value = (q ?? "").trim();
  if (!value) return { ok: false, reason: "Enter an app name or website." };
  if (value.length > 200) return { ok: false, reason: "Keep it under 200 characters: an app name or its website." };
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) {
    return { ok: false, reason: "Only web addresses (http or https) or plain app names work here." };
  }
  if (!/[a-z0-9]/i.test(value)) return { ok: false, reason: "Enter an app name or website." };
  return { ok: true, value };
}
