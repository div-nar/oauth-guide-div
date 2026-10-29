"use client";

import { useState } from "react";

const DEFAULT_STARTERS = ["Can I test before approval?", "Which permissions need review?", "What if I'm rejected?"];

// Any question about this app's OAuth setup, answered from the guide on this page.
export function AskBox({ slug, appName, access, starters = [] }: { slug: string; appName: string; access: string[] | null; starters?: string[] }) {
  const chips = starters.length ? starters : DEFAULT_STARTERS;
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<{ asked: string; answer?: string; error?: string } | null>(null);
  const busy = !!state && !state.answer && !state.error;

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || busy) return;
    setState({ asked: text });
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, question: text, access: access ?? [] }),
      });
      const j = await res.json().catch(() => ({}));
      setState(res.ok ? { asked: text, answer: j.answer } : { asked: text, error: j.error ?? "Could not answer right now." });
    } catch {
      setState({ asked: text, error: "Could not reach the server. Check your connection." });
    }
  };

  return (
    <div className="ask">
      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <svg className="ask-spark" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.4l-1.8-4.9L5 9.7l5.2-1.8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="currentColor" />
        </svg>
        <input
          className="ask-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ask anything about ${appName}'s OAuth setup`}
          maxLength={300}
          aria-label={`Ask a question about ${appName}'s OAuth setup`}
        />
        <button type="submit" className="ask-go" disabled={busy || question.trim().length < 3} aria-label={busy ? "Asking" : "Ask"}>
          {busy ? (
            <span className="pulse" aria-hidden />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </form>
      {!state && (
        <div className="ask-starters">
          {chips.map((s) => (
            <button key={s} type="button" onClick={() => { setQuestion(s); void ask(s); }}>{s}</button>
          ))}
        </div>
      )}
      {state && (
        <div className="ask-answer" aria-live="polite">
          <p className="ask-q">{state.asked}</p>
          {busy && <p className="ask-wait"><span className="pulse" aria-hidden /> Reading the guide…</p>}
          {state.answer && state.answer.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
          {state.error && <p className="error" role="alert">{state.error}</p>}
          {state.answer && <p className="ask-note">Answered by AI from this guide only. Check the sources on the steps before you act.</p>}
        </div>
      )}
    </div>
  );
}
