import { EvidenceBadge } from "@/components/EvidenceBadge";
import { TechDetails } from "@/components/TechDetails";
import type { Step } from "@/lib/guide-schema";
import { formatRange } from "@/lib/format";

const OWNER = { agent: "Agent", human: "You", waiting: "Wait" } as const;

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 3H3v10h10v-3M9 3h4v4M13 3 7 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// One line per step; the explanation and source open on click, so long paths stay scannable.
export function StepTable({ steps }: { steps: Step[] }) {
  return (
    <ol className="step-table">
      <li className="step-head" aria-hidden>
        <span>#</span>
        <span>Who</span>
        <span>Step</span>
        <span className="hide-sm">Time</span>
        <span />
      </li>
      {steps.map((s, i) => {
        const time = s.waitDays ? formatRange(s.waitDays, "day") : s.minutes ? formatRange(s.minutes, "min") : "";
        return (
          <li key={s.id} id={`step-${s.id}`} className={`step-row ${s.owner}`}>
            <span className="num">{i + 1}</span>
            <span><span className="owner-chip">{OWNER[s.owner]}</span></span>
            <details className="step-main">
              <summary>{s.title}</summary>
              <div className="step-body">
                <p>{s.plain}</p>
                {s.whyHuman && <p className="why">{s.whyHuman}</p>}
                {s.technical && <TechDetails text={s.technical} />}
                <EvidenceBadge evidence={s.evidence} />
                {time && <span className="show-sm muted small">{time}</span>}
              </div>
            </details>
            <span className="hide-sm muted small nowrap">{time}</span>
            {s.link ? (
              <a className="step-link" href={s.link.url} target="_blank" rel="noreferrer" title={s.link.label} aria-label={s.link.label}>
                <ExternalIcon />
              </a>
            ) : (
              <span />
            )}
          </li>
        );
      })}
    </ol>
  );
}
