import type { Difficulty, Guide, Step } from "@/lib/guide-schema";

// The steps that make up one use case's path, in guide order. Falls back to all
// steps when the use case lists none or only unknown ids.
export function stepsFor(g: Guide, useCaseId: string): Step[] {
  const ids = g.useCases.find((u) => u.id === useCaseId)?.stepIds ?? [];
  const picked = g.steps.filter((s) => ids.includes(s.id));
  return picked.length ? picked : g.steps;
}


const SEVERITY: Difficulty[] = ["not_applicable", "easy", "moderate", "hard", "gated"];
type Range = { min: number; max: number };

export type Combined = {
  ids: string[];
  labels: string[];
  difficulty: Difficulty;
  handsOnMinutes: Range;
  waitDays: Range;
  summary: string;
  scopes: string[];
  steps: Step[];
};

// Several kinds of access at once: every step any of them needs (once, in guide
// order), the hardest difficulty, the longest single wait (reviews assumed to run
// in parallel), and hands-on time added up from the combined steps.
export function combine(g: Guide, ids: string[]): Combined {
  let picked = g.useCases.filter((u) => ids.includes(u.id));
  if (!picked.length) picked = g.useCases.slice(0, 1);
  if (picked.length === 1) {
    const u = picked[0];
    return { ids: [u.id], labels: [u.label], difficulty: u.difficulty, handsOnMinutes: u.handsOnMinutes, waitDays: u.waitDays, summary: u.summary, scopes: u.scopes, steps: stepsFor(g, u.id) };
  }
  const stepIds = new Set(picked.flatMap((u) => stepsFor(g, u.id).map((s) => s.id)));
  const steps = g.steps.filter((s) => stepIds.has(s.id));
  const active = steps.filter((s) => s.owner !== "waiting" && s.minutes);
  // Step times can undercount a use case's own estimate, so never go below the largest one.
  const floor = { min: Math.max(...picked.map((u) => u.handsOnMinutes.min)), max: Math.max(...picked.map((u) => u.handsOnMinutes.max)) };
  const summed = { min: active.reduce((a, s) => a + s.minutes!.min, 0), max: active.reduce((a, s) => a + s.minutes!.max, 0) };
  const handsOnMinutes = { min: Math.max(floor.min, summed.min), max: Math.max(floor.max, summed.max) };
  const longest = picked.reduce((a, u) => (u.waitDays.max > a.max ? u.waitDays : a), picked[0].waitDays);
  return {
    ids: picked.map((u) => u.id),
    labels: picked.map((u) => u.label),
    difficulty: picked.map((u) => u.difficulty).reduce((a, d) => (SEVERITY.indexOf(d) > SEVERITY.indexOf(a) ? d : a)),
    handsOnMinutes,
    waitDays: longest,
    summary: picked.map((u) => `${u.label}: ${u.summary}`).join(" "),
    scopes: [...new Set(picked.flatMap((u) => u.scopes))],
    steps,
  };
}
