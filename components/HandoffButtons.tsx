import { AgentLaunchers } from "@/components/AgentLaunchers";
import { CopyButton } from "@/components/CopyButton";
import type { Guide } from "@/lib/guide-schema";
import { handoffPrompt } from "@/lib/handoff";

export function HandoffButtons({ guide, baseUrl }: { guide: Guide; baseUrl: string }) {
  if (!guide.oauth.supported) return null;
  const prompt = handoffPrompt(guide, baseUrl);
  const agentSteps = guide.steps.filter((s) => s.owner === "agent").length;
  return (
    <section className="handoff" aria-label="Hand this to your agent">
      <div className="handoff-head">
        <div>
          <h2 className="handoff-title">Hand this to your agent</h2>
          <p>Your agent does {agentSteps === 1 ? "1 step" : `${agentSteps} steps`} and stops for yours.</p>
        </div>
        <div className="handoff-actions">
          <AgentLaunchers prompt={prompt} />
          <CopyButton text={prompt} label="Copy prompt" className="copy-btn" />
        </div>
      </div>
    </section>
  );
}
