import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";
import { GRADE_WORD, GradeMark } from "@/components/GradeMark";
import { TimeBar } from "@/components/TimeBar";
import { formatHandsOn, formatWait } from "@/lib/format";
import type { Difficulty, Guide } from "@/lib/guide-schema";
import { listGeneratedGuides } from "@/lib/guides";
import { listLibraryGuides } from "@/lib/library";

export const dynamic = "force-dynamic";

const ORDER: Difficulty[] = ["easy", "moderate", "hard", "gated", "not_applicable"];

function Row({ g }: { g: Guide }) {
  const v = g.verdict;
  const easiest = [...g.useCases].sort((a, b) => ORDER.indexOf(a.difficulty) - ORDER.indexOf(b.difficulty))[0];
  return (
    <Link href={`/guides/${g.slug}`} className="app-row">
      <AppLogo name={g.app.name} website={g.app.website} logoUrl={g.app.logoUrl} size={36} />
      <span className="app-name">{g.app.name}</span>
      <span className="app-grade">
        <GradeMark difficulty={v.difficulty} size={14} /> {GRADE_WORD[v.difficulty]}
      </span>
      <span className="app-time">
        <TimeBar minutes={v.handsOnMinutes.max} waitDays={v.waitDays.max} difficulty={v.difficulty} />
        <span className="small">
          {v.waitDays.max ? `${formatWait(v.waitDays)} waiting` : `${formatHandsOn(v.handsOnMinutes)}, no waiting`}
        </span>
      </span>
      {easiest && easiest.difficulty !== v.difficulty && (
        <span className="app-note small muted">
          {GRADE_WORD[easiest.difficulty]} for: {easiest.label}
        </span>
      )}
    </Link>
  );
}

export default async function Home() {
  const library = [...listLibraryGuides()].sort(
    (a, b) => ORDER.indexOf(a.verdict.difficulty) - ORDER.indexOf(b.verdict.difficulty),
  );
  const generated = await listGeneratedGuides(8).catch(() => []);
  return (
    <main className="page wide">
      <section className="hero">
        <h1>Get your own OAuth app approved, without the guesswork.</h1>
        <p className="lede">
          Before your agent can act in someone&apos;s Gmail, Slack or HubSpot, you need your own app with that
          provider. Some take five minutes. Some take weeks of review. See which, what blocks you, and which
          steps your coding agent can do for you.
        </p>
        <form action="/generate" method="get" className="search">
          <label htmlFor="q" className="sr-only">App name or website</label>
          <input id="q" name="q" placeholder="Any app: Zoom, Notion, calendly.com" required maxLength={200} autoComplete="off" />
          <button className="btn" type="submit">Get the guide</button>
        </form>
        <p className="small muted">Not in the list? An agent researches it live from the official docs in about two minutes.</p>
      </section>

      <section className="apps">
        <div className="apps-head">
          <h2>Checked by hand</h2>
          <span className="small muted">Bar length is total time to approval, minutes to months</span>
        </div>
        {library.map((g) => <Row key={g.slug} g={g} />)}
      </section>

      {generated.length > 0 && (
        <section className="apps">
          <div className="apps-head">
            <h2>Researched by the agent</h2>
            <span className="small muted">Written from public docs, not yet reviewed by a person</span>
          </div>
          {generated.map((g) => <Row key={g.slug} g={g} />)}
        </section>
      )}
    </main>
  );
}
