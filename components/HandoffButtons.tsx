import { AgentLaunchers } from "@/components/AgentLaunchers";
import { AgentLinks } from "@/components/AgentLinks";
import type { Guide, Step } from "@/lib/guide-schema";
import type { Selection } from "@/lib/paths";
import { handoffPrompt } from "@/lib/handoff";
import { selectionQuery } from "@/lib/paths";

export function HandoffButtons({ guide, baseUrl, sel, steps }: { guide: Guide; baseUrl: string; sel?: Selection; steps?: Step[] }) {
  const prompt = handoffPrompt(guide, baseUrl, sel);
  const agentSteps = (steps ?? guide.steps).filter((s) => s.owner === "agent").length;
  return (
    <section className="handoff" aria-label="Give this to your agent">
      <div className="handoff-head">
        <div>
          <h2 className="handoff-title">Give this to your agent</h2>
          <p>{agentSteps === 0 ? "Your agent tells you how to do each step." : `Your agent does ${agentSteps === 1 ? "1 step" : `${agentSteps} steps`}. It stops at each step that you must do.`}</p>
        </div>
        <div className="handoff-actions">
          <AgentLaunchers prompt={prompt} label="Copy prompt" />
        </div>
      </div>
      <AgentLinks md={`/guides/${guide.slug}.md${sel ? selectionQuery(sel) : ""}`} json={`/guides/${guide.slug}.json`} />
    </section>
  );
}
