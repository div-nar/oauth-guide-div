# OAuth Guide

Live: https://oauth-guide-div.vercel.app · For agents: https://oauth-guide-div.vercel.app/llms.txt

Built for the Composio APM Integrations take-home.

## 1. Problem

Before an AI agent can act in someone's Gmail, Slack or HubSpot, the developer needs their own **OAuth app** with that provider. The OAuth app is the developer's registration: it holds the name users see on the "Allow?" screen, the callback address, and the permissions (scopes) the developer may ask for. Each of the developer's users then **connects** through that one app. If the app is not approved, nobody can connect, or only a handful of test users can.

Getting that app ready can take five minutes (GitHub) or months (Gmail's restricted scopes need verification and a yearly security assessment; LinkedIn's company-page access needs partner approval). Developers find out by piecing docs together and emailing providers. This site tells them up front: how hard it is, how long it takes including the wait, what can block them, and which steps their agent can do for them.

**Scope.** The scope is the problem, not a list of apps: getting *your own* OAuth app created and approved, for any app, with the steps run in your own code. It does not write the integration or run the token flow for you. Five apps are curated by hand because each shows a different kind of challenge (self-serve, marketplace review, security audit, CLI-based setup, partner gate). Every other app is researched live, on request, into the same structure. Difficulty is set per kind of access, not per app, because the same app can be both easy and hard: Slack is Easy if your agent only posts and Hard if it reads messages.

## 2. Who it's for

- **The developer building the agent.** Wants the path, the time and the blockers before committing to an integration.
- **Their coding agent.** In practice the developer hands the work to Claude Code, Cursor or similar, and asks it to explain the parts they don't follow. So the agent is the main reader.
- **People around the developer** who get pulled in: a Workspace admin who must approve, a domain owner, someone who pays for an assessment, a founder's office person or designer scoping the work. They need plain words, not jargon.
- **The users who will click "Connect".** They never see this site, but every decision here (scopes, verification, the unverified-app warning) shapes what they see on the consent screen.

How each one meets OAuth depends on how much they already know. So a guide asks what access you need first, then shows the verdict, then the steps; the technical detail and the jargon sit one level down ("OAuth basics", folded detail on each step), and the agent gets everything at once in Markdown.

## 3. How I built it

**Agent-first, with a human-readable website as the fallback.**

- Every guide exists as Markdown at a stable URL (`/guides/<app>.md`, listed in `/llms.txt`). **Copy prompt** gives the developer one line to paste into their agent; it points at the exact path they picked (`?access=read`, `&existing=1`). Steps are tagged `[AGENT]`, `[YOU]` or `[WAIT]`, and the agent is told to stop at every `[YOU]` step and never ask for a secret in chat. I chose plain URLs over an MCP server: nothing to install or sign in to.
- The website shows the same guide for people: a verdict card per kind of access, a step strip with the wait drawn in, one step at a time, blockers, and questions. An **ask box** answers any question about that app's setup from the guide only, and says so when the guide doesn't cover it.
- **Live research.** A research agent (OpenRouter) gets web search, a page reader and a fixed `submit_guide` structure, and reads the provider's own developer docs. Progress streams to the page. Before anything is saved, code checks the result: citations to pages the agent never opened are removed, the agent can never claim `Tested`, step links must point at the app's own site, and a guide with no claim from the app's own site is rejected as not found.
- **Checks that need no account.** After research, code opens every step link and asks the provider's sign-in endpoint about a made-up app ID ("The OAuth client was not found" means the endpoint is real). These show as **Agent checked**, kept apart from the evidence labels.
- **Evidence on every claim:** `Source` (linked official page), `Unconfirmed` (with the reason) or `Tested by hand`. Guides are labelled **Curated** (written by a person from official docs) or **Agentic Search** (researched by the agent, not yet reviewed by a person).
- Composio appears in one place only: when a review means a wait, "Can't wait?" offers Composio's own managed app as a stopgap. Code reads that from Composio's toolkit page; the research agent never looks at Composio.

Stack: Next.js, Postgres, bun. The curated guides live as JSON in the repo.

## 4. Try it, and the edge cases it handles

Type any app into the search box on the home page and watch the agent research it (about 2 minutes), or ask an agent to fetch `https://oauth-guide-div.vercel.app/guides/<app>.md`.

| Case | What happens |
|---|---|
| An ambiguous name ("Hinge", "Teams") | You pick from the options; agents get a `300` with the choices. |
| A company that doesn't exist | The agent reports it as not found instead of inventing a guide; nothing is saved, and the same name answers at once for 24 hours instead of starting another run. |
| An app with no OAuth (OpenWeather) | The guide says so, shows the API-key path in the same layout, and the key goes in your own secret store. |
| The same app under two names | One guide per app (matched on website and name); a second name refreshes the existing guide. |
| You already have an OAuth app | "Already have an app?" shows what to change and what would send you back to review. |
| Several kinds of access at once | Hardest difficulty, longest wait, and time added up from every step any of them needs. |
| Limits that only hit unlisted apps | The agent looks for them (Slack's 1 request a minute for unlisted apps that read history). |
| A long review | Wait ranges, marked as estimates where the provider publishes none, plus "Can't wait?". |
| Blocked or rejected | Each guide lists the likely failures and the fix. |
| A page trying to plant a link | Step links must point at the app's own site or a page the agent read. |
| An old research link, a blocked clipboard | Both say what happened instead of failing silently. |

## 5. What I learnt

- **The developer's agent is the real reader, and it will explain the guide back to them anyway.** That made the Markdown the product and the website the fallback. It is also faster: a real coding agent followed a guide from the copied prompt, and the Markdown route was about 0.15 s faster than the web page (about 16 KB against 52 KB). An agent re-reads the guide at every step, so that saving repeats on every fetch.
- **Small details break the whole flow.** The callback address must match exactly: register `https://dognosis.tech/callback` while your app runs on `https://www.dognosis.tech` and every sign-in fails with `redirect_uri_mismatch`. Guides make the callback its own step and list this under "Blocked or rejected?".
- **Difficulty belongs to the access, not the app.** My first Slack guide said Easy. Slack's rate-limit changelog says unlisted apps created after 29 May 2025 get 1 request a minute and 15 messages per call on history, so reading needs a Marketplace listing (10 active installs, then up to 10 business days plus up to 10 weeks of review). LinkedIn had the opposite problem: Gated for company pages and ads, self-serve for signing in and posting.
- **Some apps have no OAuth at all.** OpenWeather uses an API key. The site first showed these as a bare table; now they get the same layout and an honest "No OAuth app needed".
- **Agents invent things unless code stops them.** The research agent cited pages it never opened (Zoom) and, before the not-found path existed, had no way to say an app didn't exist. Both are now checked in code, not left to the prompt.
- **Nobody publishes the number developers want most.** Google says "several weeks", LinkedIn says nothing, HubSpot gives review windows but no total. Ranges are marked as estimates where that's the case.
- **Composio's own guides disagree on the redirect address** (GitHub's says `/api/v3/toolkits/auth/callback`, Google's still shows `/api/v1/auth-apps/add`).

**Still uncertain:** no step is `Tested by hand` yet; creating a GitHub and a Slack app on free accounts is the next check. Google publishes no price or duration for the security assessment. LinkedIn's company Page requirement comes from third-party guides. Whether HubSpot caps installs for unlisted apps. Whether separate reviews run in parallel (the combined view assumes so and says so). Notes for every claim are in `docs/evidence-log.md`.

## Limitations

- Five curated guides, not 100; the rest are agent-researched and not reviewed by a person.
- The agent's checks show pages and endpoints are live, not that a setup works end to end.
- Agent-written guides can be re-checked but not corrected by hand in the UI.
- Self-hosted or regional instances (Salesforce custom domains, Jira Server) and plan-gated app creation are only described when the agent finds them.
- The ask box and research share a model budget; research is capped per day, the ask box is not.

## Run it locally

Requires [bun](https://bun.sh) and Postgres.

```bash
bun install
createdb oauth_guides
psql oauth_guides -f db/schema.sql
cp .env.example .env.local   # then fill in the values
bun run dev
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres for agent-written guides and research jobs, e.g. `postgres://localhost/oauth_guides` |
| `OPENROUTER_API_KEY` | Models and web search for research and the ask box |
| `AGENT_MODEL` | Optional. Research agent; defaults to `openai/gpt-5.6-terra` |
| `SEARCH_MODEL` | Optional. Search, name check and ask box; defaults to `openai/gpt-5.6-luna` |
| `DAILY_GENERATION_CAP` | Research runs per day across everyone. Default 15 |
| `SITE_URL` | Optional public base URL used in links for agents |

Checks: `bun test`, `bunx tsc --noEmit` (run `bunx next typegen` first on a fresh clone), `bun run lint`, `bun run build`.

**For agents:** `GET /llms.txt` lists every guide. `GET /guides/<app>.md` (or `.json`) returns one; add `?access=<id>,<id>` and `&existing=1` for one path. An unknown app starts research and returns `202`; an ambiguous name returns `300` with options; an app that can't be confirmed returns `404`. `POST /api/ask {"slug", "question"}` answers from a guide.
