// Adapts zod's JSON Schema output to strict tool rules: every object lists all
// properties as required with additionalProperties false (nullable fields stand
// in for optional ones), and unsupported numeric/string constraints are dropped.
const DROP = new Set(["$schema", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "minItems", "maxItems"]);

export function toStrictSchema(node: unknown): Record<string, unknown> {
  if (Array.isArray(node)) return node.map(toStrictSchema) as never;
  if (!node || typeof node !== "object") return node as never;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (DROP.has(k)) continue;
    out[k] = typeof v === "object" ? toStrictSchema(v) : v;
  }
  if (out.type === "object" && out.properties) {
    out.required = Object.keys(out.properties as object);
    out.additionalProperties = false;
  }
  return out;
}
