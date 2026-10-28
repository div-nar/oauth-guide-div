import type { Guide } from "@/lib/guide-schema";
import { formatWait } from "@/lib/format";

// A journey strip: one stop per step, coloured by who does it. Waiting stretches
// out because it is the part that takes calendar time.
export function PathVisual({ guide }: { guide: Guide }) {
  const total = (o: string) => guide.steps.filter((s) => s.owner === o).length;
  return (
    <figure className="journey" aria-label="Who does each step, in order">
      <ol className="journey-track">
        {guide.steps.map((s, i) => (
          <li
            key={s.id}
            className={`stop ${s.owner}`}
            style={s.owner === "waiting" ? { flexGrow: Math.max(3, Math.round((s.waitDays?.max ?? 14) / 7)) } : undefined}
          >
            <a href={`#step-${s.id}`} title={s.title}>
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
