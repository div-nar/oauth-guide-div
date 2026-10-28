import type { Guide, Step } from "@/lib/guide-schema";

// The steps that make up one use case's path, in guide order. Falls back to all
// steps when the use case lists none or only unknown ids.
export function stepsFor(g: Guide, useCaseId: string): Step[] {
  const ids = g.useCases.find((u) => u.id === useCaseId)?.stepIds ?? [];
  const picked = g.steps.filter((s) => ids.includes(s.id));
  return picked.length ? picked : g.steps;
}
