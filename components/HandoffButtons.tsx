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
          <p>It does the {agentSteps} agent steps and stops to ask you at each of yours.</p>
        </div>
        <CopyButton text={prompt} label="Copy prompt" className="copy-btn" />
      </div>
      <AgentLaunchers prompt={prompt} />
    </section>
  );
}
