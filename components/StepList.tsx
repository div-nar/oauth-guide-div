import { EvidenceBadge } from "@/components/EvidenceBadge";
import type { Step } from "@/lib/guide-schema";
import { formatRange } from "@/lib/format";

const OWNER = { agent: "Your agent", human: "You", waiting: "Waiting" } as const;

export function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="steps">
      {steps.map((s, i) => {
        const time = s.waitDays ? formatRange(s.waitDays, "day") : s.minutes ? formatRange(s.minutes, "min") : null;
        return (
          <li key={s.id} id={`step-${s.id}`} className={`step ${s.owner}`}>
            <div className="step-rail">
              <span className="step-num">{i + 1}</span>
            </div>
            <div className="step-body">
              <div className="step-meta">
                <span className="owner-chip">{OWNER[s.owner]}</span>
                {time && <span className="muted small">{time}</span>}
              </div>
              <h3>{s.title}</h3>
              <p>{s.plain}</p>
              {s.whyHuman && <p className="why">{s.whyHuman}</p>}
              {s.link && (
                <a className="step-link" href={s.link.url} target="_blank" rel="noreferrer">
                  {s.link.label}
                  {s.link.prefilled && <span className="prefilled">pre-filled</span>}
                </a>
              )}
              {s.technical && (
                <details className="tech">
                  <summary>Technical detail</summary>
                  <div>{s.technical}</div>
                </details>
              )}
              <EvidenceBadge evidence={s.evidence} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
