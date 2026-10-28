import { EvidenceBadge } from "@/components/EvidenceBadge";
import type { Step } from "@/lib/guide-schema";
import { formatRange } from "@/lib/format";

const OWNER = { agent: "Your agent can do this", human: "You do this", waiting: "Waiting on the provider" } as const;

export function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="steps">
      {steps.map((s) => {
        const time = s.waitDays ? formatRange(s.waitDays, "day") : s.minutes ? formatRange(s.minutes, "min") : null;
        return (
          <li key={s.id} className={`step ${s.owner}`}>
            <div className="owner">
              {OWNER[s.owner]}
              {time && <span className="muted">, {time}</span>}
            </div>
            <h3>{s.title}</h3>
            <p>{s.plain}</p>
            {s.whyHuman && <p className="why">Why you: {s.whyHuman}</p>}
            {(s.technical || s.url) && (
              <details className="tech">
                <summary>Technical detail</summary>
                <div>
                  {s.technical}
                  {s.url && (
                    <>
                      {s.technical && <br />}
                      <a href={s.url} target="_blank" rel="noreferrer">{s.url}</a>
                    </>
                  )}
                </div>
              </details>
            )}
            <EvidenceBadge evidence={s.evidence} />
          </li>
        );
      })}
    </ol>
  );
}
