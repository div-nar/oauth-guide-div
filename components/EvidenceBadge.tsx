import type { Evidence } from "@/lib/guide-schema";

const WORD = { tested: "Tested by hand", sourced: "Source", uncertain: "Unconfirmed" } as const;

export function EvidenceBadge({ evidence }: { evidence: Evidence }) {
  return (
    <div className={`ev ${evidence.level}`}>
      <span className="tag">{WORD[evidence.level]}</span>
      {evidence.sources.length > 0 && (
        <span>
          {evidence.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
            </span>
          ))}
        </span>
      )}
      {evidence.note && <span className="note">{evidence.note}</span>}
    </div>
  );
}
