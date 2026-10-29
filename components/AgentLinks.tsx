const ICON = {
  doc: <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6" />,
  braces: <path d="M9 4H8a2 2 0 0 0-2 2v4l-2 2 2 2v4a2 2 0 0 0 2 2h1M15 4h1a2 2 0 0 1 2 2v4l2 2-2 2v4a2 2 0 0 1-2 2h-1" />,
};

function Icon({ d }: { d: keyof typeof ICON }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICON[d]}
    </svg>
  );
}

// The plain-text versions, for people who paste a guide into an LLM themselves.
export function AgentLinks({ md, json }: { md: string; json: string }) {
  return (
    <div className="agent-links">
      <a href={md} target="_blank" rel="noreferrer" title="View as Markdown"><Icon d="doc" />.md</a>
      <a href={json} target="_blank" rel="noreferrer" title="View as JSON"><Icon d="braces" />.json</a>
    </div>
  );
}
