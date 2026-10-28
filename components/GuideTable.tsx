"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { GRADE_WORD, GradeMark } from "@/components/GradeMark";
import { TimeBar } from "@/components/TimeBar";
import type { Difficulty } from "@/lib/guide-schema";

export type GuideRow = {
  slug: string;
  name: string;
  website: string;
  logoUrl?: string | null;
  difficulty: Difficulty;
  handsOn: string;
  waiting: string;
  handsOnMax: number;
  waitMax: number;
  source: "library" | "agent";
  easier?: string | null;
};

const TABS = [
  { id: "all", label: "All" },
  { id: "library", label: "Checked by hand" },
  { id: "agent", label: "Researched by agent" },
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
    <section className="board">
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
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" /></svg>
        <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, or type any app to research it" autoComplete="off" maxLength={200} />
        {q.trim() && shown.length === 0 && <button className="btn small-btn" type="submit">Research {q.trim()}</button>}
      </form>

      <div className="board-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} type="button">
            {t.label} <span className="muted">({count(t.id)})</span>
          </button>
        ))}
      </div>

      <table className="board-table">
        <thead>
          <tr>
            <th className="num">#</th>
            <th>App</th>
            <th>Difficulty</th>
            <th className="hide-sm">Your time</th>
            <th>Waiting</th>
            <th className="hide-sm bar-col">Time to approval</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={r.slug} onClick={() => router.push(`/guides/${r.slug}`)}>
              <td className="num muted">{i + 1}</td>
              <td>
                <Link href={`/guides/${r.slug}`} className="app-cell">
                  <AppLogo name={r.name} website={r.website} logoUrl={r.logoUrl} size={30} />
                  <span>
                    <span className="app-name">{r.name}</span> <span className="muted small">{domain(r.website)}</span>
                    {r.easier && <span className="easier small">{r.easier}</span>}
                  </span>
                </Link>
              </td>
              <td className="nowrap"><GradeMark difficulty={r.difficulty} size={13} /> {GRADE_WORD[r.difficulty]}</td>
              <td className="hide-sm nowrap">{r.handsOn}</td>
              <td className="nowrap">{r.waiting}</td>
              <td className="hide-sm bar-col"><TimeBar minutes={r.handsOnMax} waitDays={r.waitMax} difficulty={r.difficulty} /></td>
            </tr>
          ))}
          {shown.length === 0 && (
            <tr className="empty">
              <td colSpan={6}>
                No guide for &ldquo;{q.trim()}&rdquo; yet. Press Enter and the research agent will write one from the
                official docs in about two minutes.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
