import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How we checked", description: "What was read, tested, corrected and left uncertain." };

const LABELS = [
  ["Tested by hand", "A person on the team did it and saw the result."],
  ["Source", "An official page says it. The page is linked next to the claim."],
  ["Unconfirmed", "No official page confirms it, or the page is silent on a number we needed. The guide says why."],
];

const CORRECTIONS = [
  {
    title: "Slack was wrong: it is not 'easy' for agents that read messages",
    what: "Our first Slack guide said Easy, no waiting. Slack's own changelog says commercially distributed apps outside the Slack Marketplace created after May 29, 2025 can call conversations.history and conversations.replies only once a minute, 15 messages at a time.",
    fix: "Slack now shows a verdict per kind of access: posting is Easy, reading history is Hard (Marketplace listing needs 10 active installs, then up to 10 business days plus up to 10 weeks of review).",
    lesson: "We had read Slack's distribution and OAuth pages, not its rate-limit changelog. The research agent now looks for limits that only apply to unlisted or unverified apps.",
    source: "https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps",
  },
  {
    title: "LinkedIn's headline verdict misled the common case",
    what: "We first labelled LinkedIn Gated. The gate is real for company pages, ads, sales and recruiting, but signing people in and posting as them is self-serve.",
    fix: "LinkedIn's headline is now Easy, with Gated shown for the partner-only kinds of access.",
    lesson: "Difficulty depends on the access you need, not on the app. Every guide now leads with 'What access do you need?'.",
    source: "https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access",
  },
  {
    title: "Gmail's security assessment applies when Composio relays the email",
    what: "We first wrote that the yearly assessment applies 'if your servers handle the email'. With Composio, the email passes through Composio's servers under your app.",
    fix: "The guide now says to expect the assessment, and marks that reading as Unconfirmed until Google or Composio confirm it.",
    lesson: "When a requirement depends on architecture, say which architecture the reader has.",
    source: "https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification",
  },
  {
    title: "The research agent cited pages it never opened",
    what: "On its first live run (Zoom) the agent cited godevelopers.zoom.us pages. It had only opened developers.zoom.us.",
    fix: "Every agent-written claim is now checked against the pages the agent actually searched or read. Other citations are removed, and a claim left with none is marked Unconfirmed. The agent can never mark anything Tested.",
    lesson: "Do not trust a model's citations; check them in code.",
    source: null,
  },
  {
    title: "Composio's own guides disagree on the redirect address",
    what: "Composio's GitHub guide gives https://backend.composio.dev/api/v3/toolkits/auth/callback as current. Its Google guide still shows https://backend.composio.dev/api/v1/auth-apps/add.",
    fix: "Every guide tells you to copy the redirect address from your Composio auth config rather than from any page.",
    lesson: "A guide that hard-codes a value goes stale. Point at the source of truth.",
    source: "https://composio.dev/auth/github",
  },
];

const READ = [
  ["GitHub", "Creating an OAuth app; OAuth app access restrictions", "No review. Up to 100 apps per owner, 10 callback URLs. New organisations block OAuth apps until an owner approves."],
  ["Slack", "Installing with OAuth; Distribution; Marketplace review guide; rate-limit changelog; app manifests", "HTTPS redirect required. Public distribution has no review. Pre-filled 'create app' links work through manifests."],
  ["Gmail", "Restricted scope verification; Gmail scopes; Unverified apps; Security assessment", "readonly, modify, compose and metadata are restricted; send is sensitive. 100-user cap while unverified. Yearly reassessment."],
  ["HubSpot", "Create an app; OAuth quickstart; Marketplace listing requirements", "CLI projects. Super Admins install. Listing needs 3 active installs, first review within 10 business days."],
  ["LinkedIn", "Getting access; Community Management overview", "Only sign-in and member posting are self-serve. Community Management is vetted in two tiers. r_member_social is closed."],
];

const OPEN = [
  "Nothing is Tested by hand yet. Creating a GitHub OAuth app and a Slack app on free accounts is the next check.",
  "Google publishes no price or duration for the security assessment. Our 1 to 4 week range is an estimate.",
  "LinkedIn's company Page requirement comes from third-party guides; LinkedIn's own docs we read do not state it.",
  "Whether HubSpot caps installs for unlisted apps. Current docs do not say.",
  "Slack's FAQ reportedly extends the read throttling to existing installs from March 3, 2026. We have not confirmed that on Slack's own page.",
  "Agent-researched guides are not reviewed by a person. They are labelled as such everywhere they appear.",
];

export default function EvidencePage() {
  return (
    <main className="page">
      <nav className="crumbs small" aria-label="Breadcrumb"><Link href="/">guides</Link> <span aria-hidden>/</span> <span>how we checked</span></nav>
      <h1 className="research-title">How we checked</h1>
      <p className="lede">
        What we read, what we got wrong and fixed, and what we still can&apos;t confirm. Last updated 2026-10-28.
      </p>

      <section className="block">
        <h2 className="label">What the labels mean</h2>
        <ul className="who-list">
          {LABELS.map(([k, v]) => <li key={k}><strong>{k}</strong><span className="muted">{v}</span></li>)}
        </ul>
      </section>

      <section className="block">
        <h2 className="label">What we got wrong, and how we caught it</h2>
        <div className="faq">
          {CORRECTIONS.map((c) => (
            <details key={c.title} open>
              <summary>{c.title}</summary>
              <div className="faq-body">
                <p><strong>What we had:</strong> {c.what}</p>
                <p><strong>What changed:</strong> {c.fix}</p>
                <p><strong>What we learned:</strong> {c.lesson}</p>
                {c.source && <p className="small"><a href={c.source} target="_blank" rel="noreferrer">{c.source}</a></p>}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="block">
        <h2 className="label">What we read for the checked guides</h2>
        <ul className="who-list">
          {READ.map(([app, pages, found]) => (
            <li key={app}><strong>{app}</strong><span className="muted"><span>{pages}.</span> {found}</span></li>
          ))}
        </ul>
      </section>

      <section className="block">
        <h2 className="label">Still uncertain</h2>
        <ul className="open-list">
          {OPEN.map((o) => <li key={o}>{o}</li>)}
        </ul>
      </section>

      <section className="block">
        <h2 className="label">How the research agent is kept honest</h2>
        <ul className="open-list">
          <li>It searches and reads official developer docs, then must hand back a guide in a fixed structure. Guides that do not fit are sent back once with the errors, then rejected.</li>
          <li>Every citation is checked against the pages it actually saw. Anything else is removed.</li>
          <li>It can only label claims Source or Unconfirmed, never Tested. Wait times a provider does not publish are marked as estimates.</li>
          <li>Page text it reads is treated as data, never as instructions, and it cannot open private or local network addresses.</li>
        </ul>
      </section>
    </main>
  );
}
