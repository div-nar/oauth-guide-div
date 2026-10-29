# OAuth Guide

Live: https://oauth-guide-div.vercel.app · For agents: https://oauth-guide-div.vercel.app/llms.txt

Built for the Composio APM Integrations take-home.

## 1. Problem

Before an AI agent can act in someone's Gmail or Slack, the developer needs their own **OAuth app** with that provider: the registration that holds the name on the "Allow?" screen, the callback address and the permissions (scopes). Each of their users then connects through that one app. Getting it ready takes five minutes for GitHub and months for some apps (Gmail's restricted scopes need verification and a yearly security assessment). Developers find out by piecing docs together.

I spoke to developers about their workflows and realised that they increasingly rely on AI agents to hand-hold them through the process. Rather than navigating documentation, developers rely on agents to find information, direct them to the right configuration dashboards, guide them step by step, and troubleshoot errors along the way. This led me to frame the problem as both an information discovery and navigation problem.

**Scope** is the problem, not a list of apps: getting *your own* OAuth app created and approved, for any app, used from your own code. Five apps are curated because each shows a different challenge (self-serve, marketplace review, security audit, CLI setup, partner gate); any other app is researched live into the same structure. Difficulty is set per kind of access, because the same app can be both: Slack is Easy if your agent only posts and Hard if it reads messages.

## 2. Who it's for

- **The developer** building the agent, deciding whether an integration is worth it.
- **Their coding agent**, which does the setup and explains it back to them. It is the main reader.
- **People pulled in**: a Workspace admin who approves, a domain owner, whoever pays for an assessment, a founder's-office person scoping the work.
- **The end users** who click "Connect". They never see this site, but scopes and verification decide what their consent screen says.

Proficiency varies, so a guide asks what access you need, shows the verdict, then the steps, with jargon and technical detail one level down. The agent gets everything at once in Markdown.

## 3. What did I build?

Much of this work is handled by agents, but the experience is fragmented. This realization led me to construct a two-faced website, with a default preference for servicing agents and a website for human fallback.

**For agents (the default).** Every guide is plain Markdown at a stable address, and `llms.txt` lists every guide, so an agent finds and reads the right one in a single fetch. A developer copies one prompt into their agent, and it points at the exact path for the access they picked. Each step is tagged as something the agent can do in the developer's signed-in browser or terminal, something only the developer can do (signing in, accepting terms, handling the client secret), or a wait on the provider. The agent does its steps, stops at every one that needs the developer, and never asks for a secret in chat. The prompt also tells it to ask for the exact callback URL first, read the provider's Protocol before it writes OAuth code, and use Troubleshooting when a step fails.

**For humans (the fallback).** The website shows the same guide for developers who want to read it themselves, share it, or check what their agent is doing. They pick the access their agent needs from a table, because that, not the app, decides how hard the setup is: Slack takes minutes if the agent only posts, and months if it reads messages. The table shows each option's time, wait and permissions side by side, so there is no pop-up to get through first. Below it: what to have ready, the steps (two points each, one open at a time), common pitfalls and troubleshooting side by side, and the provider's Protocol. An ask box answers questions about that app's setup from the guide alone.

Both faces come from the same guide, so the developer and their agent never disagree about what to do next.

**Any app, not just a list.** Five guides are curated by hand, each showing a different kind of challenge. For any other app, an agent reads the provider's own developer docs in real time and writes a guide in the same structure, usually in about two minutes. If it can't confirm the app exists, it says so rather than making one up.

**Evidence the developer can trust.** Every claim links to the provider page that supports it, or is marked as unconfirmed with the reason. Code, not the model, checks that the agent actually read what it cites, and that each step's link points at the provider's own site. After research, code also opens every step link and asks the provider's sign-in endpoint about a made-up app; that shows as **Agent checked**, apart from the evidence labels. Guides are labelled **Curated** or **Agentic Search** so readers know who wrote them.

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
- **OAuth is not one protocol in practice.** OAuth 1.0a, OAuth 2.0 and OAuth 2.1 differ, and providers apply 2.0 differently. GitHub supports PKCE with S256 only; Slack makes it opt-in and irreversible; LinkedIn allows it for native clients only. An agent cannot guess these, so every guide has a sourced Protocol section, and code reads the PKCE methods a provider publishes.
- **Small details break the whole flow, and the rules differ.** Google, GitHub and LinkedIn need the callback to match: register `https://dognosis.tech/callback` while the app runs on `https://www.dognosis.tech` and sign-in fails with `redirect_uri_mismatch`. Slack accepts a subdirectory of the registered URL. I first wrote "exact match" for Slack too; reading its docs corrected me.
- **Developers asked for less, not more.** A developer told me what he wanted: common pitfalls, troubleshooting, clear steps of no more than two points, and no pop-up asking about access before the guide. The page was rebuilt around exactly that.
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
