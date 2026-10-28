import { AgentLaunchers } from "@/components/AgentLaunchers";
import { CopyLine } from "@/components/CopyLine";
import type { Guide, Step } from "@/lib/guide-schema";
import type { Selection } from "@/lib/paths";
import { handoffPrompt } from "@/lib/handoff";

export function HandoffButtons({ guide, baseUrl, sel, steps }: { guide: Guide; baseUrl: string; sel?: Selection; steps?: Step[] }) {
  const prompt = handoffPrompt(guide, baseUrl, sel);
  const agentSteps = (steps ?? guide.steps).filter((s) => s.owner === "agent").length;
  return (
    <section className="handoff" aria-label="Hand this to your agent">
      <div className="handoff-head">
        <div>
          <h2 className="handoff-title">Hand this to your agent</h2>
          <p>{agentSteps === 0 ? "Your agent walks you through each step." : `Your agent does ${agentSteps === 1 ? "1 step" : `${agentSteps} steps`} and stops for yours.`}</p>
        </div>
        <div className="handoff-actions">
          <AgentLaunchers prompt={prompt} />
        </div>
      </div>
      <CopyLine text={prompt} />
    </section>
  );
}
