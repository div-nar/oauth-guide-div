import type { Difficulty } from "@/lib/guide-schema";

export const GRADE_WORD: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  gated: "Gated",
  not_applicable: "No OAuth",
};

export const GRADE_MEANING: Record<Difficulty, string> = {
  easy: "Self-serve, no review",
  moderate: "Some setup friction, no required review",
  hard: "Provider review that takes weeks",
  gated: "Needs the provider's approval as a partner",
  not_applicable: "Uses API keys or similar instead",
};

// Trail-style marks: circle, square, diamond, octagon.
export function GradeMark({ difficulty, size = 28 }: { difficulty: Difficulty; size?: number }) {
  const label = `${GRADE_WORD[difficulty]}: ${GRADE_MEANING[difficulty]}`;
  const common = { width: size, height: size, viewBox: "0 0 24 24", role: "img", "aria-label": label } as const;
  switch (difficulty) {
    case "easy":
      return <svg {...common} className="grade"><circle cx="12" cy="12" r="10" fill="var(--easy)" /></svg>;
    case "moderate":
      return <svg {...common} className="grade"><rect x="3" y="3" width="18" height="18" fill="var(--moderate)" /></svg>;
    case "hard":
      return <svg {...common} className="grade"><path d="M12 1 L23 12 L12 23 L1 12 Z" fill="var(--hard)" /></svg>;
    case "gated":
      return (
        <svg {...common} className="grade">
          <path d="M8 1h8l7 7v8l-7 7H8l-7-7V8z" fill="var(--gated)" />
          <rect x="6" y="10.5" width="12" height="3" fill="#fff" />
        </svg>
      );
    default:
      return <svg {...common} className="grade"><circle cx="12" cy="12" r="9" fill="none" stroke="var(--na)" strokeWidth="3" strokeDasharray="4 3" /></svg>;
  }
}
