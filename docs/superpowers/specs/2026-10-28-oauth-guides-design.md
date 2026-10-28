# OAuth App Setup Guides: design

Composio APM Integrations take-home. Target submit: Fri 2026-10-30. Budget: about 6 to 8 hours of build.

## Intent

Someone building an AI agent needs their own OAuth app with each provider (Gmail, Slack, HubSpot...) before their users can click "Connect". The effort ranges from 5 minutes to months of review, and nobody can tell which in advance. This site tells them, up front, how hard it is, how long it takes (including approval waits), what can block them, and what their agent can do versus what a human must do. Then it lets them hand the work to their agent.

## Who it serves (decided)

- **Agents do the setup.** Developers increasingly hand this work to Claude Code, Cursor or similar, and ask those agents to explain things. The agent is a first-class reader of every guide.
- **Not only developers.** Founder's Office staff, designers and other people with mixed technical skill will use it. Plain words first, technical detail underneath, jargon explained on first use.

## What gets built

1. **Library**: a handful of hand-checked guides for apps chosen to cover different setup challenges (my call, to confirm while planning): GitHub (self-serve, minutes), Slack (quick to create, review only for a Marketplace listing), Gmail/Google (restricted scopes, verification plus security audit, weeks), HubSpot or Salesforce (developer account or connected app), and LinkedIn (partner-program gated).
2. **Live generation**: a user types an app name or website. An agent researches it in real time (search plus reading official docs), streams its progress, and produces a guide in the same structure, with its own shareable URL. This works for apps outside the library.
3. **Two views of every guide** (decided, modelled on parallel.ai's HUMAN/MACHINE toggle):
   - *Human view*: a verdict card (difficulty, hands-on time, waiting time, agent vs human step counts, who you'll need), a visual of the path, then the steps.
   - *Machine view*: clean Markdown (and JSON) at a stable URL (`/guides/<app>/ai`, `.md`), exact URLs, field values, redirect URI and scopes, with a copy button.
   - *Hand-off*: "Open in Claude Code" (`claude-cli://open?q=...`) and "Open in Cursor" deep links, plus "copy this prompt" for people using Claude.ai or ChatGPT.
4. **Evidence page**: for a sample of guides, what was checked against official sources or tried by hand, what got corrected, and what stayed unverified.

## Guide structure (every guide, library or live)

- Verdict: difficulty (Easy / Moderate / Hard / Gated), hands-on time, wait time range, one-line why.
- Who you'll need: roles (e.g. Workspace admin, domain owner, budget owner, legal signer).
- Steps: each with an owner (`agent`, `human`, `waiting`), a plain-language instruction, the technical detail, time, why a human is needed where relevant, and sources.
- Forks: the choices that change difficulty (e.g. "reading email" moves Gmail from Easy to Hard).
- Nuances and blockers, each with what to do when stuck.
- Evidence label on every claim: `tested`, `sourced` (with link), or `uncertain`.
- Last checked date.

## Visual (open)

The verdict card is agreed. The path picture is undecided: swimlane timeline, hand-drawn style flowchart with forks, or vertical checklist. It renders from the guide data, so it can be chosen late without rework. My lean: a swimlane with fork callouts.

## Stack (my call, unless overridden)

- Next.js App Router, TypeScript, **bun**, deployed on Vercel.
- Library guides as JSON files in the repo.
- Live generation on the Claude API with server-side web search and web fetch tools, streamed to the page. Output validated against the guide schema before saving.
- Generated guides stored in plain Postgres (Neon via Vercel), not Supabase.
- A rate limit and spend cap on live generation, since reviewers will use the public link.

## Non-goals

- All 100 guides.
- User accounts or sign-in.
- Completing real provider approvals, or using paid provider accounts.
- Production polish.

## Anti-goals

- Guides that read more certain than the evidence supports.
- A chatbot bolted on. The agent's output is a structured, shareable guide.
- Jargon-first pages that only a developer can follow.
- Credentials anywhere in the repo.

## Stretch (only if time allows)

- The live agent tries the provider's setup flow in a headless browser up to the sign-in wall, and records where it stopped as `tested` evidence.
- An MCP endpoint (`get_oauth_guide(app)`) so agents can pull guides directly.

## Left to the builder

Page layout and styling, exact schema field names, model choice per step, caching, and how progress streams in the UI.
