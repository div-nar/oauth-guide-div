import { z } from "zod";

// Optional fields are nullish so the same schema can drive a strict tool
// definition, where every property must be listed as required.

const Range = z
  .object({ min: z.number(), max: z.number() })
  .refine((r) => r.min <= r.max, { message: "min must be <= max" });

const Source = z.object({ url: z.string(), title: z.string() });

export const EvidenceSchema = z
  .object({
    level: z.enum(["tested", "sourced", "uncertain"]),
    sources: z.array(Source),
    note: z.string().nullish(),
  })
  .refine((e) => e.level !== "sourced" || e.sources.length > 0, {
    message: "sourced evidence needs at least one source",
  });

export const StepSchema = z.object({
  id: z.string(),
  owner: z.enum(["agent", "human", "waiting"]),
  title: z.string(),
  plain: z.string(),
  technical: z.string().nullish(),
  minutes: Range.nullish(),
  waitDays: Range.nullish(),
  whyHuman: z.string().nullish(),
  url: z.string().nullish(),
  evidence: EvidenceSchema,
});

export const GuideSchema = z.object({
  slug: z.string(),
  app: z.object({ name: z.string(), website: z.string(), logoUrl: z.string().nullish() }),
  lastChecked: z.string(),
  generatedBy: z.enum(["library", "agent"]),
  oauth: z.object({ supported: z.boolean(), notes: z.string().nullish() }),
  verdict: z.object({
    difficulty: z.enum(["easy", "moderate", "hard", "gated", "not_applicable"]),
    handsOnMinutes: Range,
    waitDays: Range,
    summary: z.string(),
  }),
  whoYouNeed: z.array(z.object({ role: z.string(), why: z.string() })),
  steps: z.array(StepSchema),
  forks: z.array(z.object({ condition: z.string(), effect: z.string(), evidence: EvidenceSchema })),
  nuances: z.array(
    z.object({ title: z.string(), detail: z.string(), ifStuck: z.string(), evidence: EvidenceSchema }),
  ),
  config: z.object({
    consoleUrl: z.string().nullish(),
    redirectUriNote: z.string().nullish(),
    scopes: z.array(
      z.object({
        name: z.string(),
        plain: z.string(),
        sensitivity: z.enum(["basic", "sensitive", "restricted", "unknown"]),
      }),
    ),
  }),
});

export type Guide = z.infer<typeof GuideSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Difficulty = Guide["verdict"]["difficulty"];

export function parseGuide(x: unknown): Guide {
  return GuideSchema.parse(x);
}
