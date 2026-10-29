import type { Step } from "@/lib/guide-schema";
import { formatWait } from "@/lib/format";

// A journey strip: one stop per step, coloured by who does it. Waiting stretches
// out because it is the part that takes calendar time.
// With `active`, it doubles as a progress bar: the line fills up to the current
// step, and `progress` (0 to 1) fills the stretch towards the next one.
export function PathVisual({ steps, active, progress = 0, onSelect }: { steps: Step[]; active?: number; progress?: number; onSelect?: (i: number) => void }) {
  const total = (o: string) => steps.filter((s) => s.owner === o).length;
  return (
    <figure className="journey" aria-label="Who does each step, in order">
      <ol className="journey-track">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className={`stop ${s.owner}${active === undefined ? "" : i === active ? " current" : i > active ? " later" : " passed"}${active !== undefined && i <= active ? " reached" : ""}`}
            style={{
              ...(s.owner === "waiting" ? { flexGrow: Math.max(3, Math.round((s.waitDays?.max ?? 14) / 7)) } : {}),
              ...(active !== undefined && i === active + 1 ? ({ "--seg": progress } as React.CSSProperties) : {}),
            }}
          >
            <a
              href={`#step-${s.id}`}
              title={s.title}
              aria-current={i === active ? "step" : undefined}
              onClick={onSelect ? (e) => { e.preventDefault(); onSelect(i); } : undefined}
            >
              <span className="dot">{i + 1}</span>
              {s.owner === "waiting" && <span className="wait-label">{s.waitDays ? formatWait(s.waitDays) : "Review"}</span>}
            </a>
          </li>
        ))}
      </ol>
      <figcaption className="journey-legend small">
        <span><i className="key agent" /> Your agent: {total("agent")}</span>
        <span><i className="key human" /> You: {total("human")}</span>
        <span><i className="key waiting" /> Waiting on the provider: {total("waiting")}</span>
      </figcaption>
    </figure>
  );
}
