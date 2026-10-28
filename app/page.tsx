import Link from "next/link";
import { GRADE_MEANING, GRADE_WORD, GradeMark } from "@/components/GradeMark";
import { formatHandsOn, formatWait } from "@/lib/format";
import type { Difficulty } from "@/lib/guide-schema";
import { listLibraryGuides } from "@/lib/library";

const ORDER: Difficulty[] = ["easy", "moderate", "hard", "gated"];

export default function Home() {
  const guides = [...listLibraryGuides()].sort(
    (a, b) => ORDER.indexOf(a.verdict.difficulty) - ORDER.indexOf(b.verdict.difficulty),
  );
  return (
    <main className="page">
      <section className="ask">
        <h1>Which app do your users need to connect?</h1>
        <p>
          Before your agent can act in someone&apos;s Gmail, Slack or HubSpot, you need your own OAuth app with
          that provider. Some take five minutes. Some take weeks of review. Find out which, and hand the
          setup to your agent.
        </p>
        <form action="/generate" method="get">
          <label htmlFor="q" className="sr-only">App name or website</label>
          <input id="q" name="q" placeholder="App name or website, e.g. Zoom or calendly.com" required maxLength={200} />
          <button className="btn" type="submit">Get the guide</button>
        </form>
        <p className="small muted" style={{ margin: "10px 0 0" }}>
          Apps we haven&apos;t covered yet are researched live by an agent. It takes about a minute.
        </p>
      </section>

      <section className="library">
        <h2>Checked guides</h2>
        <p className="small muted" style={{ margin: 0 }}>Researched from official docs, with every claim linked.</p>
        <div>
          {guides.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="library-row">
              <GradeMark difficulty={g.verdict.difficulty} />
              <div>
                <div className="name">{g.app.name}</div>
                <div className="small muted">{GRADE_WORD[g.verdict.difficulty]}</div>
              </div>
              <div className="row-facts">
                Hands-on {formatHandsOn(g.verdict.handsOnMinutes)}
                <br />
                Waiting: {formatWait(g.verdict.waitDays)}
              </div>
            </Link>
          ))}
        </div>
        <div className="legend">
          {ORDER.map((d) => (
            <span key={d}>
              <GradeMark difficulty={d} size={14} /> {GRADE_WORD[d]}: {GRADE_MEANING[d].toLowerCase()}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
