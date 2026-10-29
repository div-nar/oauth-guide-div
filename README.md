# OAuth Guide

Live: https://oauth-guide-div.vercel.app · For agents: https://oauth-guide-div.vercel.app/llms.txt

Built for the Composio APM Integrations take-home.

## Different Developers

Fundamentally, I needed to understand: **Who are developers?**

**Humans.** At first glance, it would be software engineers, but through AI, anybody can build. This allows a designer to ship code to update Figma, a marketer to modify a query on Mixpanel through its MCP, and a Founder’s Office Associate to provision databases through Neon. Defining them as developers, I’ve built the website.

**Agents.** Each of these developers hands work to a coding agent, so the agent is a developer too, and often the first one to read the documentation.

## Scope

Before an agent can act in someone's Gmail or Slack, the developer needs their own **OAuth app** with that provider: the registration that holds the name on the "Allow?" screen, the callback address and the permissions (scopes). Each of their users then connects through that one app. I scoped the product to exactly that: getting *your own* OAuth app created and approved, for any app, and used from your own code. Composio appears once, as a "Can't wait?" option to use its managed app during a review.

Five guides are curated by hand, each chosen for a different challenge: GitHub (self-serve), Slack (marketplace review), Gmail (security assessment), HubSpot (CLI setup) and LinkedIn (partner gate). Any other app is researched live into the same structure. Difficulty is set per kind of access, not per app, because one app can be both: Slack is Easy if your agent only posts, and Hard if it reads messages.

## Developers Work Differently Now

After developing a foundational understanding of how OAuth works, I wanted to understand how developers actually build applications that use OAuth. I spoke to developers about their workflows and realised that usage comes in two forms.

**Agents.** Rather than navigating documentation, developers rely on agents to find information, direct them to the right configuration dashboards, and guide them step by step.

**Humans.** Developers don’t 100% trust LLMs, and want a look at documentation that ideally provides: pitfalls to avoid, troubleshooting guidance and steps presented in a clear, concise manner.

## How It Works

With a note of the share of work handled by coding agents, OAuth integration is fragmented. This realization led me to construct a two-sided website, with a preference for serving agents and a website for human fallback.

**Agents.** Every guide is a plain markdown file at a stable address, and a single `llms.txt` lists every guide, so an agent can find and read the right one in a single fetch. A developer can copy one prompt into their agent that points at the exact path for the app and the access they need.

Each step is tagged as something either the agent can do in the developer's signed-in browser or terminal, or something only the developer can do. The agent does its steps, stops at every one that needs the developer, and never asks for a secret in chat. In the event someone asks for an app with no guide, an agent reads that provider's own developer docs.

It searches the web, reads pages and submits a guide, in the same fixed structure as the curated ones. Progress streams to the page while it works, usually for 60 to 90 seconds. Every claim cites a provider page that the agent read, or is marked unconfirmed with the reason.

**Humans.** The website provides a high-level overview of an app’s OAuth setup, helping developers understand the process and give their agents visibility into what needs to happen. Each guide lays out the expected setup time, including any approval wait times, the permissions and scopes involved, how the app applies OAuth (the version, PKCE and callback rules), the people who need to be involved, and the steps required to get connected. It also highlights common blockers and how to resolve them. An ask box lets developers ask questions about an app’s setup and get answers grounded exclusively in that app’s guide.

## Iterating Development

Over successive iterations, I became increasingly convinced that the workflow was more agent-driven than human-driven.

**Humans.** My initial version of the website prioritized visual polish, but when I shared it with developers, it failed to generate much interest. Their feedback was consistent: reduce friction. V2, which is the version of the site I submit, drastically cuts down on visual and navigational overhead, prioritizing direct access to high-level overviews for humans to index their understanding and evaluate their agent’s performance.

**Agents.** I also explored whether agent-friendly documentation could reduce retrieval overhead. Comparing a guide’s web page with its Markdown version (listed in `llms.txt`), I observed an improvement of approximately 0.15 seconds in request time in one agent run. While modest per request, this could compound when agents repeatedly retrieve information from the same provider. The larger bottleneck was end-to-end research, which typically took 60–90 seconds per run. This was more a cost issue, so I split the workflow between two models: GPT-5.6 Luna for finding relevant documentation and GPT-5.6 Terra for consolidating it into a coherent setup guide.

I validated it with unit tests, local browser testing, stubbed API responses, database checks, and trial runs, finding three interesting features:

- **Application discovery:** App names could be ambiguous, nonexistent, or duplicated. I tested cases such as Hinge, ensuring the system distinguished between products.
- **Integration paths:** Not every application requires OAuth. OpenWeather, for instance, used an API-key approach, while some applications lacked an accessible developer platform. The system needed to identify the appropriate authentication method or state clearly when a path couldn’t be found.
- **Protocol differences:** I accounted for differences in how providers apply OAuth 2.0 and the stricter OAuth 2.1 rules, such as PKCE and exact callback matching, ensuring the guides reflected the relevant protocol requirements and setup steps rather than treating all OAuth implementations identically.

## How We Should Work

Building this changed how I think about development from here on out.

**Agents.** While I stuck first to building for humans, post-GPT, the primary reader of documentation is an agent, and not a person, so the Markdown became the product and the website became a layer for oversight. Designing for agents also meant designing for their weaknesses: they invent citations and guess at details, so checks had to be placed at every layer, with honesty being rewarded. And most crucially for me, I realised, not all agent-driven development is an MCP server; for a task an agent reads once, a plain URL and an `llms.txt` were enough.

**Humans.** Less was more. My first version's polish didn't land; cutting friction did. What mattered was a high-level overview for decision-making: before committing to an integration, a developer needs to know whether it is worth it, which access they need, how long approval takes, and who must be involved. An agent is prone to make small mistakes. But these small details decide success, such as a callback that differs only by "www", which makes sign-in fail or not enforcing PKCE rules that change from one provider to the next.

## What I Corrected

Building and checking the guides changed my approach. The full record is in [`docs/evidence-log.md`](docs/evidence-log.md).

- **Developers and non-developers want the same thing: minimum friction.** Both asked for less: a quick overview, clear steps and no extra screens. So the page leads with the overview, and the technical detail sits one level down.
- **Not an MCP server.** I first assumed agents needed an MCP server. Setting up an OAuth app happens once per app, and the agent only reads, so a plain URL and `llms.txt` work with any agent and need nothing installed.
- **Protocols differ for each app, and developers need to know them.** I first treated OAuth as one protocol. GitHub supports PKCE with S256 only, Slack makes it opt-in and irreversible, and LinkedIn allows it for native clients only. Every guide now has a sourced Protocol section.
- **Slack's callback.** I first wrote "exact match" for every provider. Slack accepts a subdirectory of the registered URL; Google, GitHub and LinkedIn do not.
- **Steering the agent.** The research agent cited pages it never opened and invented guides for apps that do not exist. It now writes into a fixed structure, code checks every citation against the pages it read, and it reports "not found" instead of guessing. The ask box answers only from the app's guide.

## Limitations

- Tested by hand on GitHub and Slack, from creating the app to a successful sign-in through it. Both runs found gaps the docs-based guides missed: GitHub asks for a one-time code before it makes a secret, and our Slack link was rejected until it added a bot user. We have no log of either token exchange. Few providers publish review times, so wait ranges are marked as estimates. Details are in `docs/evidence-log.md`.
- Five curated guides; the rest are agent-researched and not reviewed by a person.
- Agent checks show pages and endpoints are live, not that a setup works end to end.
- Self-hosted or regional instances (Salesforce custom domains, Jira Server) are only described when the agent finds them.

## Run it locally

Requires [bun](https://bun.sh) and Postgres.

```bash
bun install
createdb oauth_guides
psql oauth_guides -f db/schema.sql
cp .env.example .env.local   # DATABASE_URL, OPENROUTER_API_KEY
bun run dev
```

Optional: `AGENT_MODEL` (default `openai/gpt-5.6-terra`), `SEARCH_MODEL` (default `openai/gpt-5.6-luna`), `DAILY_GENERATION_CAP` (default 15), `SITE_URL`. Checks: `bun test`, `bunx tsc --noEmit`, `bun run lint`, `bun run build`.
