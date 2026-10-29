import { EvidenceBadge } from "@/components/EvidenceBadge";
import type { Step } from "@/lib/guide-schema";
import { formatRange } from "@/lib/format";

const OWNER = { agent: "Agent", human: "You", waiting: "Wait" } as const;

export function StepTable({ steps }: { steps: Step[] }) {
  return (
    <ol className="step-table">
      <li className="step-head" aria-hidden>
        <span>#</span>
        <span>Who</span>
        <span>Step</span>
        <span className="hide-sm">Time</span>
      </li>
      {steps.map((s, i) => {
        const time = s.waitDays ? formatRange(s.waitDays, "day") : s.minutes ? formatRange(s.minutes, "min") : "";
        return (
          <li key={s.id} id={`step-${s.id}`} className={`step-row ${s.owner}`}>
            <span className="num">{i + 1}</span>
            <span><span className="owner-chip">{OWNER[s.owner]}</span></span>
            <div className="step-main">
              <h3>{s.title}</h3>
              <p>{s.plain}</p>
              {s.whyHuman && <p className="why">{s.whyHuman}</p>}
              {s.link && (
                <a className="step-link" href={s.link.url} target="_blank" rel="noreferrer">
                  {s.link.label}
                  {s.link.prefilled && <span className="prefilled">pre-filled</span>}
                </a>
              )}
              <details className="tech">
                <summary>{s.technical ? "Technical detail and source" : "Source"}</summary>
                {s.technical && <div>{s.technical}</div>}
                <EvidenceBadge evidence={s.evidence} />
              </details>
              <span className="show-sm muted small">{time}</span>
            </div>
            <span className="hide-sm muted small nowrap">{time}</span>
          </li>
        );
      })}
    </ol>
  );
}
