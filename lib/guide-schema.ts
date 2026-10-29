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
  // Deep link to the exact page for this step; prefilled when the provider supports it.
  link: z.object({ url: z.string(), label: z.string(), prefilled: z.boolean() }).nullish(),
  evidence: EvidenceSchema,
});

export const UseCaseSchema = z.object({
  id: z.string(),
  label: z.string(),
  difficulty: z.enum(["easy", "moderate", "hard", "gated", "not_applicable"]),
  handsOnMinutes: Range,
  waitDays: Range,
  summary: z.string(),
  scopes: z.array(z.string()),
  // Which steps make up this path; empty means all steps.
  stepIds: z.array(z.string()),
  evidence: EvidenceSchema,
});

export const GuideSchema = z
  .object({
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
  // What the agent will do decides difficulty; verdict is the most common agent case.
  useCases: z.array(UseCaseSchema),
  // useCaseIds on people, forks and gotchas: which paths they belong to (empty or null = all).
  whoYouNeed: z.array(z.object({ role: z.string(), why: z.string(), useCaseIds: z.array(z.string()).nullish() })),
  steps: z.array(StepSchema),
  forks: z.array(
    z.object({ condition: z.string(), effect: z.string(), evidence: EvidenceSchema, useCaseIds: z.array(z.string()).nullish() }),
  ),
  nuances: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      ifStuck: z.string(),
      evidence: EvidenceSchema,
      useCaseIds: z.array(z.string()).nullish(),
    }),
  ),
  // What a developer sees when they get stuck or rejected, why, and what to do.
  blockers: z
    .array(
      z.object({
        symptom: z.string(),
        cause: z.string(),
        fix: z.string(),
        escalate: z.object({ url: z.string(), label: z.string() }).nullish(),
        useCaseIds: z.array(z.string()).nullish(),
        evidence: EvidenceSchema,
      }),
    )
    .nullish(),
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
  // Whether Composio's own (managed) app can be used while yours is set up or in review.
  composio: z
    .object({
      managedApp: z.enum(["yes", "no", "unknown"]),
      note: z.string(),
      evidence: EvidenceSchema,
      // Access that Composio's app does not cover, or that its docs do not confirm.
      limits: z.array(z.object({ useCaseIds: z.array(z.string()), note: z.string(), evidence: EvidenceSchema })).nullish(),
    })
    .nullish(),
  // For teams that already have an OAuth app with this provider.
  existingApp: z
    .object({
      summary: z.string(),
      steps: z.array(StepSchema),
      reReviewTriggers: z.array(z.object({ trigger: z.string(), effect: z.string(), evidence: EvidenceSchema })),
    })
    .nullish(),
  })
  .refine((g) => !g.oauth.supported || g.useCases.length > 0, {
    message: "a guide for an OAuth app needs at least one use case",
    path: ["useCases"],
  });

export type Guide = z.infer<typeof GuideSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type UseCase = z.infer<typeof UseCaseSchema>;
export type Difficulty = Guide["verdict"]["difficulty"];

export function parseGuide(x: unknown): Guide {
  return GuideSchema.parse(x);
}

// Rows saved by older agent versions lack fields added since. An empty
// stepIds list means "every step", so it is a safe default for them.
export function parseStoredGuide(x: unknown): Guide {
  const g = x as { useCases?: { stepIds?: unknown }[] };
  const useCases = g.useCases?.map((u) => ({ ...u, stepIds: u.stepIds ?? [] }));
  return parseGuide(useCases ? { ...g, useCases } : g);
}
