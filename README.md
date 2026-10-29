# OAuth Guide

Before an AI agent can act in someone's Gmail, Slack or HubSpot, the developer needs their own OAuth app with that provider. Some take five minutes. Some take weeks of review, a paid security audit, or a partner application. This site tells you which, before you start, and hands the setup to your coding agent.

Built for the Composio APM Integrations take-home.

## What it does

- **Guides for any app.** Five are researched by hand (GitHub, Slack, Gmail, HubSpot, LinkedIn). Any other app is researched live by an agent from the provider's official docs, usually in 1 to 2 minutes, and gets the same structure.
- **Difficulty depends on the access you need, not the app.** Slack is Easy if your agent only posts and Hard if it reads history. Pick one or more kinds of access and the verdict, time, waiting, path, steps, people and questions all follow.
- **"Already have an app?"** shows what to change and what would send you back to review, instead of setup steps.
- **"Can't wait?"** When there is a review wait, the guide says you can connect users today with Composio's own managed app, with its trade-offs.
- **Agent-first.** Every guide has a plain-text version that coding agents read. "Hand this to your agent" opens Claude Code, Cursor or ChatGPT with a prompt that points at the exact path you picked. Steps are tagged `[AGENT]`, `[YOU]` or `[WAIT]`, and the agent stops at yours.
- **Evidence on every claim**: `Source` (linked official page), `Unconfirmed` (with the reason), or `Tested by hand`.
- **Checked by the agent**: after research, code opens every step link and asks the provider's sign-in endpoint about a made-up app. What it saw is shown under each step, kept apart from the evidence label so it never reads as `Tested`.

## For agents

- `GET /llms.txt` lists every guide.
- `GET /guides/<app>.md` returns a guide. Add `?access=<id>,<id>` and `&existing=1` for one path.
- An unknown app starts research and returns `202` with "fetch again in about 2 minutes". An ambiguous name ("Teams") returns `300` with the options.
- `POST /api/generate {"query": "...", "exact": false, "refresh": false}` starts research; poll `GET /api/generate/<id>`.

## Run it locally

Requires [bun](https://bun.sh) and Postgres.

```bash
bun install
createdb oauth_guides
psql oauth_guides -f db/schema.sql
cp .env.example .env.local   # then fill in the values
bun run dev
```

`.env.local`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres for agent-written guides and research jobs, e.g. `postgres://localhost/oauth_guides` |
| `OPENROUTER_API_KEY` | Model and web search access for the research agent |
| `AGENT_MODEL` | Optional. Defaults to `openai/gpt-5.6-terra` |
| `SEARCH_MODEL` | Optional. Defaults to `openai/gpt-5.6-luna` (search helper and name check) |
| `DAILY_GENERATION_CAP` | Spend limit: research runs per day across everyone. Default 10 |
| `SITE_URL` | Optional public base URL used in links for agents |

Checks: `bun test`, `bunx tsc --noEmit` (run `bunx next typegen` first on a fresh clone), `bun run lint`, `bun run build`.

## How the research agent works

1. A cheap check asks whether the name is ambiguous ("Teams", "Google") and offers choices if so.
2. A background job runs the agent with three tools: web search, a page reader on our server, and `submit_guide`, which takes the guide in a fixed structure. Progress streams to a timeline and a header pill, so you can keep browsing.
3. Before saving, code (not the model) checks the result:
   - Citations to pages the agent never saw are removed; a claim left with none becomes `Unconfirmed`.
   - The agent can never mark anything `Tested`.
   - Step links must point at the app's own site or a page the agent saw, so a poisoned page cannot plant a link.
   - Things the structure cannot express (a reversed range, a "sourced" claim with no source) are repaired, not rejected.
4. Code then runs checks that need no account, and records them with the date:
   - Every step link is opened: it loads, loads behind a sign-in, is not found, or gives no clear answer (a site that blocks bots is "unclear", never "broken").
   - The sign-in endpoint (`config.authorizeUrl`) is asked to start a flow for a made-up app ID. An answer such as "The OAuth client was not found" confirms the endpoint is real. Pages built in the browser (Slack, HubSpot) give no readable answer, so they stay "unclear".
   - Where the provider publishes its OAuth configuration (`/.well-known/openid-configuration`), the endpoint is compared with it.
   The model cannot submit checks; a failed check run saves the guide without them. `bun run scripts/check-library.ts` re-runs them for the hand-checked guides.
5. Page text is treated as data. The page reader and the checks refuse private and local network addresses.

## Key decisions

- **Your own code, not a platform.** The brief is about getting the developer's own OAuth app created and approved, whatever they connect it through. So the steps assume the developer runs the OAuth flow in their own code: their callback address, their secret store. Composio appears in one place only: "Can't wait?", a stopgap while a review is pending.
- **Agents are the main reader; the website is the fallback.** Developers ask their coding agent first, so every guide is plain text at a stable URL. We chose plain URLs over an MCP server: nothing to install or sign in to, and no tool definitions sitting in the agent's context.
- **Verdict per kind of access.** Our first Slack guide said Easy; it is Hard for agents that read messages. The same app can be both.
- **Honest numbers.** Providers rarely publish review times. Where a range is our estimate, the guide says so.
- **Plain words first, detail folded away**, because founders' office staff and designers use this too.
- **Postgres, not a hosted database that sleeps**; the five checked guides live as JSON in the repo.

## What we checked, corrected and could not verify

**Read for the checked guides**: each provider's official pages on app registration, OAuth, scopes, review or verification, partner programs and marketplace listing (linked on every claim). Notes in `docs/evidence-log.md`.

**What we got wrong, and fixed:**

1. **Slack is not Easy for agents that read.** Slack's changelog: commercially distributed apps outside the Marketplace created after May 29, 2025 get 1 request a minute and 15 messages per call on `conversations.history` and `conversations.replies`. Reading now needs a Marketplace listing (10 active installs, then up to 10 business days plus up to 10 weeks of review). We had read Slack's distribution pages but not its rate-limit changelog; the research agent now looks for limits on unlisted apps.
2. **LinkedIn's verdict misled the common case.** It is Gated for company pages, ads, sales and recruiting, but signing people in and posting as them is self-serve.
3. **Gmail's security assessment** was marked `Unconfirmed`, because we could not tell whether it applied to the setup we first assumed. Google's restricted scope page states it directly: apps that reach restricted data "from or through a third-party server" need a yearly assessment. A backend that reads email for your agent is such a server, so the step is now sourced.
4. **The research agent cited pages it never opened** (on Zoom). Citations are now checked in code.

**Still uncertain:**

- Nothing is `Tested by hand` yet. Creating a GitHub OAuth app and a Slack app on free accounts is the next check.
- The agent's checks (29 Oct 2026) found no broken step links across the five guides. The sign-in endpoints of GitHub, Gmail and LinkedIn answered; Slack's and HubSpot's gave no readable answer. Google and HubSpot publish OAuth configurations that list the same endpoint.
- Google publishes no price or duration for the security assessment.
- LinkedIn's company Page requirement comes from third-party guides.
- Whether HubSpot caps installs for unlisted apps.
- Whether separate reviews can run in parallel (the combined view assumes they can and says so).
- Agent-written guides are not reviewed by a person and are labelled that way.

## Limitations

- Five hand-checked guides, not 100.
- No hands-on setup attempts by an agent in a browser yet. The agent's checks show that pages and endpoints are live, not that the setup works end to end.
- Agent-written guides can be re-checked but not corrected by hand in the UI.
- Self-hosted or regional instances (Salesforce custom domains, Jira Server) and plan-gated app creation are only described when the agent finds them, not modelled.
