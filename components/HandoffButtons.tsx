import { CopyButton } from "@/components/CopyButton";
import type { Guide } from "@/lib/guide-schema";
import { claudeCodeLink, cursorLink, handoffPrompt } from "@/lib/handoff";

export function HandoffButtons({ guide, baseUrl }: { guide: Guide; baseUrl: string }) {
  if (!guide.oauth.supported) return null;
  const prompt = handoffPrompt(guide, baseUrl);
  const agentSteps = guide.steps.filter((s) => s.owner === "agent").length;
  return (
    <div className="handoff">
      <p>
        Hand this to your agent. It does the {agentSteps} agent steps and stops to ask you at each of yours.
      </p>
      <div className="row">
        <a className="btn" href={claudeCodeLink(prompt)}>Open in Claude Code</a>
        <a className="btn secondary" href={cursorLink(prompt)}>Open in Cursor</a>
        <CopyButton text={prompt} label="Copy prompt for Claude.ai or ChatGPT" />
      </div>
    </div>
  );
}
