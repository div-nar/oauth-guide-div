# OAuth Guide

Live: https://oauth-guide-div.vercel.app · For agents: https://oauth-guide-div.vercel.app/llms.txt

Built for the Composio APM Integrations take-home.

## 1. Problem

Before an AI agent can act in someone's Gmail or Slack, the developer needs their own **OAuth app** with that provider: the registration that holds the name on the "Allow?" screen, the callback address and the permissions (scopes). Each of their users then connects through that one app. Getting it ready takes five minutes for GitHub and months for some apps (Gmail's restricted scopes need verification and a yearly security assessment). Developers find out by piecing docs together. This site tells them up front: how hard, how long including the wait, what can block them, and which steps their agent can do.

**Scope** is the problem, not a list of apps: getting *your own* OAuth app created and approved, for any app, used from your own code. Five apps are curated because each shows a different challenge (self-serve, marketplace review, security audit, CLI setup, partner gate); any other app is researched live into the same structure. Difficulty is set per kind of access, because the same app can be both: Slack is Easy if your agent only posts and Hard if it reads messages.

## 2. Who it's for

- **The developer** building the agent, deciding whether an integration is worth it.
- **Their coding agent**, which does the setup and explains it back to them. It is the main reader.
- **People pulled in**: a Workspace admin who approves, a domain owner, whoever pays for an assessment, a founder's-office person scoping the work.
- **The end users** who click "Connect". They never see this site, but scopes and verification decide what their consent screen says.

Proficiency varies, so a guide asks what access you need, shows the verdict, then the steps, with jargon and technical detail one level down. The agent gets everything at once in Markdown.

## 3. How I built it

- **Agent-first.** Every guide is Markdown at a stable URL (`/guides/<app>.md`, listed in `/llms.txt`). **Copy prompt** gives one line to paste into an agent, pointing at the exact path picked. Steps are tagged `[AGENT]`, `[YOU]` or `[WAIT]`; the agent stops at every `[YOU]` step and never asks for a secret. The website is the human fallback, with an ask box limited to that app's setup.
- **Evidence on every claim:** `Source` (linked official page), `Unconfirmed` (with the reason) or `Tested by hand`. Guides are **Curated** (written by a person from official docs) or **Agentic Search** (researched by the agent, not reviewed).
- **Code checks the agent.** The research agent reads the provider's own docs. Before saving, code removes citations to pages it never opened, never lets it claim `Tested`, keeps step links on the app's own site, and rejects a guide with nothing from the app's own site as "not found". After saving, code opens every step link and asks the sign-in endpoint about a made-up app ID; that shows as **Agent checked**, apart from the evidence labels.

Next.js, Postgres, bun, OpenRouter. Composio appears once: "Can't wait?" offers its managed app during a review, read by code from Composio's toolkit page.

## 4. Try it, and edge cases

Type any app into the search box and watch it research (about 2 minutes), or have an agent fetch `/guides/<app>.md`.

- **Ambiguous name** ("Hinge", "Teams"): pick from options; agents get a `300`.
- **A company that doesn't exist:** reported as not found, nothing saved, no repeat run for 24 hours.
- **No OAuth at all** (OpenWeather): the API-key path in the same layout.
- **Limits only unlisted apps hit:** the agent looks for them (Slack's 1 request a minute on history).

## 5. What I learnt

- **The developer's agent is the real reader, and it explains the guide back to them anyway.** That made the Markdown the product and the website the fallback. The Markdown is about 16 KB against 52 KB for the page; in one run, a coding agent following a guide was about 0.15 s faster per fetch that way.
- **An MCP server or an API isn't the answer to everything.** Setting up an OAuth app happens once per app, and the agent only needs to read. A plain URL plus `llms.txt` works with any agent, needs nothing installed, adds nothing to the agent's context, and a person can open the same link. An MCP server would earn its place if the agent had to act repeatedly, such as tracking a review across sessions.
- **Updating an existing OAuth app is a different path from creating one.** Adding a callback is quick, but new scopes or branding changes can send an approved app back to review, and existing users must approve again. Guides have an "Already have an app?" path for this.
- **Small details break the whole flow.** The callback must match exactly: register `https://dognosis.tech/callback` while the app runs on `https://www.dognosis.tech` and every sign-in fails with `redirect_uri_mismatch`.
- **Difficulty belongs to the access, not the app.** My first Slack guide said Easy; Slack's changelog limits unlisted apps to 1 request a minute on history, so reading needs a Marketplace listing (10 installs, then up to 10 weeks of review).
- **Some apps have no OAuth**, and agents invent things unless code stops them: the research agent cited pages it never opened and had no way to say an app didn't exist. Both are now checked in code.

**Not verified:** no step is `Tested by hand` yet; creating a GitHub app on a free account is next. Google publishes no price or duration for its security assessment, and few providers publish review times, so wait ranges are marked as estimates. Details are in `docs/evidence-log.md`.

## Limitations

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
