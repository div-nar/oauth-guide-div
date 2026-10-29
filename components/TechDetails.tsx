// Technical text starts closed, so the plain step comes first. Only `backticked` parts use the code font.
export function TechDetails({ text, label = "Technical details" }: { text: string; label?: string }) {
  return (
    <details className="tech">
      <summary>{label}</summary>
      <p className="tech-text">
        {text.split(/(`[^`]+`)/).map((part, i) =>
          part.startsWith("`") && part.endsWith("`") && part.length > 1 ? <code key={i}>{part.slice(1, -1)}</code> : part,
        )}
      </p>
    </details>
  );
}
