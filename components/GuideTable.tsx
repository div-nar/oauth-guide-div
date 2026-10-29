"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { GRADE_WORD, GradeMark } from "@/components/GradeMark";
import type { Difficulty } from "@/lib/guide-schema";

export type GuideRow = {
  slug: string;
  name: string;
  website: string;
  logoUrl?: string | null;
  difficulty: Difficulty;
  summary: string;
  handsOn: string;
  waiting: string;
  handsOnMax: number;
  waitMax: number;
  source: "library" | "agent";
  easier?: string | null;
  options: { id: string; label: string; difficulty: Difficulty }[];
  defaultAccess: string | null;
  hasExisting: boolean;
};

const TABS = [
  { id: "all", label: "All" },
  { id: "library", label: "Curated" },
  { id: "agent", label: "Agentic Search" },
] as const;

function domain(website: string) {
  return website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

export function GuideTable({ rows }: { rows: GuideRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (tab === "all" || r.source === tab) &&
        (!needle || r.name.toLowerCase().includes(needle) || domain(r.website).includes(needle)),
    );
  }, [rows, q, tab]);
  const count = (id: string) => (id === "all" ? rows.length : rows.filter((r) => r.source === id).length);

  return (
    <section>
      <form
        className="board-search"
        onSubmit={(e) => {
          e.preventDefault();
          const v = q.trim();
          if (!v) return;
          const hit = shown.length === 1 ? shown[0] : rows.find((r) => r.name.toLowerCase() === v.toLowerCase());
          router.push(hit ? `/guides/${hit.slug}` : `/generate?q=${encodeURIComponent(v)}`);
        }}
      >
        <label htmlFor="q" className="sr-only">Search guides or add any app</label>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" /></svg>
        <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guides, or type any app to research it..." autoComplete="off" maxLength={200} />
        {q.trim() && shown.length === 0 ? (
          <button className="btn small-btn" type="submit">Research {q.trim()}</button>
        ) : (
          <kbd>/</kbd>
        )}
      </form>

      <div className="board-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} type="button">
            {t.label} ({count(t.id)})
          </button>
        ))}
      </div>

      <div className="card-grid">
        {shown.map((r) => (
          <Link
            key={r.slug}
            href={`/guides/${r.slug}`}
            className="card"
          >
            <div className="card-title">
              <AppLogo name={r.name} website={r.website} logoUrl={r.logoUrl} size={24} />
              <h3>{r.name}</h3>
              <span className="card-grade">
                <GradeMark difficulty={r.difficulty} size={11} /> {GRADE_WORD[r.difficulty]}
              </span>
            </div>
            <p className="card-desc">{r.summary}</p>
            {r.easier && <p className="card-easier">{r.easier}</p>}
            <p className="card-meta">
              {r.handsOn} of work{r.waitMax ? `, ${r.waiting} waiting` : ", no waiting"}
              {r.source === "agent" && <span className="card-agent">agentic search</span>}
            </p>
          </Link>
        ))}
      </div>
      {shown.length === 0 && (
        <p className="empty">
          There is no guide for &ldquo;{q.trim()}&rdquo; yet. Press Enter. The research agent then writes a guide from
          the official docs in 60 to 90 seconds.
        </p>
      )}
    </section>
  );
}
