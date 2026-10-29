export type QueryCheck = { ok: true; value: string } | { ok: false; reason: string };

export function validateQuery(q: string): QueryCheck {
  const value = (q ?? "").trim();
  if (!value) return { ok: false, reason: "Enter an app name or website." };
  if (value.length > 200) return { ok: false, reason: "Use 200 characters or fewer. Enter an app name or its website." };
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) {
    return { ok: false, reason: "Enter a web address (http or https) or an app name." };
  }
  if (!/[a-z0-9]/i.test(value)) return { ok: false, reason: "Enter an app name or website." };
  return { ok: true, value };
}
