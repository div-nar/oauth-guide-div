# Evidence log

What we read, what we tried, and what surprised us. Dates are when the check happened.

## How claims are labelled

- **tested**: a person on the team did it by hand and saw the result.
- **sourced**: an official page says it (linked in the guide).
- **uncertain**: no official page confirms it, or the page is silent on a number we needed. The guide says why.

## 2026-10-28: library research (official docs)

| App | Read | Key facts confirmed | Left uncertain |
|---|---|---|---|
| GitHub | Creating an OAuth app; OAuth app access restrictions | No review. Up to 100 apps per owner, 10 callback URLs. New orgs restrict OAuth apps by default; owners approve. | None material. |
| Slack | Installing with OAuth; Distribution; Marketplace review guide | Redirect must be HTTPS. Public distribution needs a checklist, no review. Marketplace: 10+ active installs, preliminary review up to 10 business days, functional review up to 10 weeks. | Exact dashboard button labels. |
| Gmail | Restricted scope verification; Gmail scopes table; Unverified apps; Security assessment | gmail.readonly/modify/compose/metadata are restricted, gmail.send is sensitive. Restricted verification "can potentially take several weeks". Annual reassessment. 100 new-user cap when unverified. | Assessment price and duration (Google publishes neither). Testing-mode refresh token lifetime (7 days is widely quoted, not re-checked). |
| HubSpot | Create an app; OAuth quickstart; Marketplace listing requirements | Apps are CLI projects (`hs project create/upload`). Super Admin installs. Unlisted installs show an "unverified app" checkbox. Listing needs 3 active installs; first review within 10 business days; full cycle up to 60 days. Tokens last 30 min. | Whether unlisted apps have an install cap. |
| LinkedIn | Getting access; Community Management overview | Only Sign In (OpenID Connect) and Share on LinkedIn are self-serve. Community Management is vetted, with Development and Standard tiers; Standard needs a screencast. Development tier request only on a fresh app. r_member_social is closed. | Company Page requirement and who can verify (third-party sources only). Vetting time (unpublished). |

## Surprises worth surfacing

1. **Composio's own guides disagree on the redirect URI.** The GitHub guide (composio.dev/auth/github) says the current address is `https://backend.composio.dev/api/v3/toolkits/auth/callback`. The Google guide (composio.dev/auth/googleapps) still shows `https://backend.composio.dev/api/v1/auth-apps/add`. Our guides tell people to copy the value from the Composio dashboard.
2. **Existing guides stop at "you may need verification".** Composio's Google guide covers creating credentials, then says verification may be needed. It does not say that reading email triggers a yearly third-party security assessment, or that gmail.send avoids it. That gap is the main thing our guides add.
3. **GitHub's real friction is on the customer side.** Creating the app is trivial, but organisation OAuth restrictions are on by default for new orgs, so a user's org owner must approve the app.
4. **No provider publishes the number developers want most.** Google says "several weeks", LinkedIn says nothing, HubSpot gives review windows but not totals. Our wait ranges are marked as our estimates where that's the case.

## Hands-on attempts

## 2026-10-29: "Blocked or rejected?" sections

Read each provider's review or troubleshooting page for what happens after a rejection or a stall, and what to do next:
- GitHub: OAuth app access restrictions are on by default for new organisations; `redirect_uri_mismatch` fix.
- Google: brand verification requirements and manual review (2 to 3 business days); Trust & Safety follow-up emails pause review; Terms of Service and Safe Browsing flags need an appeal first.
- Slack: 10 active workspace installs before Marketplace submission; preliminary review returns, queue resets; workspace app approval.
- HubSpot: three active installs to list; Draft mode for incomplete listings; 10 business days first review, 60 days overall; unused scopes rejected.
- LinkedIn: rejected Community Management requests cannot re-apply with the same app; Standard tier screencast rules.

Composio's own apps, checked against each toolkit page (correction): the "Can't wait?" note promised Composio's app as a way round every review. Composio's Slack app is not Marketplace-listed yet ("working on Marketplace review"), so it does not avoid the reading limits. The Gmail and LinkedIn toolkit pages confirm a managed app but not its permissions, so those paths are now marked Unconfirmed.

Forum and blog reports of Google homepage rejections were not used: none came from Google.

## 2026-10-29: a coding agent followed a guide

Div gave a real coding agent the "Copy prompt" text from a live guide. The agent fetched the guide's Markdown and followed it. Div noticed the agent's route was about 0.15 s faster than the web page; the Markdown is about 16 KB against about 52 KB for the page.

The same day, code checked what an agent sees on the live site:
- `llms.txt` lists 11 guides. Each link returns its Markdown, with steps tagged `[AGENT]`, `[YOU]` or `[WAIT]`.
- The copied Slack prompt with "read" access points at `/guides/slack.md?access=read`. That URL returns the matching path: hard, 14 to 80 days.
- An app that does not exist ("Quorvantix Lumebridge") returns 404 with "We couldn't confirm a developer platform". No guide is saved and no second run starts.

Not recorded yet, so no step is marked `Tested by hand` from this run: the app, the agent, the steps it completed, and whether an OAuth app was created.

- [ ] GitHub OAuth app on a free account (Div): time taken, screens, surprises.
- [ ] Slack app with public distribution on a free workspace (Div): time taken, screens, surprises.

No credentials are recorded here or anywhere in the repo.
