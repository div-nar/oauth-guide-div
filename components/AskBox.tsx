"use client";

import { useState } from "react";

const STARTERS = ["Can I test before my app is approved?", "Which permissions need a review?", "What do I do if I'm rejected?"];

// Any question about this app's OAuth setup, answered from the guide on this page.
export function AskBox({ slug, appName, access }: { slug: string; appName: string; access: string[] | null }) {
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
      <h3 className="faq-group">Ask about {appName}&apos;s OAuth setup</h3>
      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <input
          className="ask-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Anything about getting a ${appName} OAuth app approved…`}
          maxLength={300}
          aria-label={`Ask a question about ${appName}'s OAuth setup`}
        />
        <button type="submit" className="ask-go" disabled={busy || question.trim().length < 3}>{busy ? "Asking…" : "Ask"}</button>
      </form>
      {!state && (
        <div className="ask-starters">
          {STARTERS.map((s) => (
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
