import type { Evidence } from "@/lib/guide-schema";

const WORD = { tested: "Tested by hand", sourced: "Sourced", uncertain: "Uncertain" } as const;

export function EvidenceBadge({ evidence }: { evidence: Evidence }) {
  return (
    <div className="ev">
      <span className={`tag ${evidence.level}`}>{WORD[evidence.level]}</span>
      {evidence.sources.map((s) => (
        <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
          {s.title}
        </a>
      ))}
      {evidence.note && <span className="note">{evidence.note}</span>}
    </div>
  );
}
