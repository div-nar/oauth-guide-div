import type { Guide, Step } from "@/lib/guide-schema";

// Swimlane of who does what. Active work and waiting use different scales, so
// widths are relative weights, not literal time: waiting dominates when it exists.
const LANES: { owner: Step["owner"]; label: string; color: string }[] = [
  { owner: "agent", label: "Agent", color: "var(--agent)" },
  { owner: "human", label: "You", color: "var(--you)" },
  { owner: "waiting", label: "Provider", color: "var(--wait)" },
];

function weight(s: Step): number {
  if (s.owner === "waiting") return Math.max(6, (s.waitDays?.max ?? 7) / 2);
  return Math.max(1.5, Math.sqrt(s.minutes?.max ?? 5));
}

export function PathVisual({ guide }: { guide: Guide }) {
  const weights = guide.steps.map(weight);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const starts = weights.map((_, i) => weights.slice(0, i).reduce((a, b) => a + b, 0));
  const placed = guide.steps.map((s, i) => ({
    s,
    i,
    left: (starts[i] / total) * 100,
    width: (weights[i] / total) * 100,
  }));
  const hasWait = guide.steps.some((s) => s.owner === "waiting");
  return (
    <figure className="path" aria-label="Who does each step, in order">
      <div className="lanes">
        {LANES.map((lane) => (
          <div key={lane.owner} style={{ display: "contents" }}>
            <div className="lane-label" style={{ color: lane.color }}>{lane.label}</div>
            <div className="track">
              {placed
                .filter((p) => p.s.owner === lane.owner)
                .map((p) => (
                  <div
                    key={p.s.id}
                    className="seg"
                    title={`${p.i + 1}. ${p.s.title}`}
                    style={{ left: `${p.left}%`, width: `calc(${p.width}% - 3px)`, background: lane.color }}
                  >
                    {p.i + 1}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="axis">
        <span>Start</span>
        <span>{hasWait ? "Waiting is drawn long because it is" : "All hands-on, no waiting"}</span>
        <span>Ready</span>
      </div>
    </figure>
  );
}
