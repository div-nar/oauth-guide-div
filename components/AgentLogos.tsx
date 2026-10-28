import { AppLogo } from "@/components/AppLogo";

const AGENTS = [
  { name: "Claude Code", site: "claude.ai" },
  { name: "Cursor", site: "cursor.com" },
  { name: "Codex", site: "openai.com" },
  { name: "ChatGPT", site: "chatgpt.com" },
  { name: "Gemini", site: "gemini.google.com" },
  { name: "Windsurf", site: "windsurf.com" },
];

export function AgentLogos({ size = 32 }: { size?: number }) {
  return (
    <ul className="agent-logos">
      {AGENTS.map((a) => (
        <li key={a.name} title={a.name}>
          <AppLogo name={a.name} website={a.site} size={size} />
          <span>{a.name}</span>
        </li>
      ))}
    </ul>
  );
}
