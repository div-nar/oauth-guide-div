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

### 2026-10-29: GitHub OAuth app, by hand (Div), following our guide

Div followed the GitHub guide on a personal account. Claude Code acted as the agent in chat and gave the field values. Div clicked through GitHub.

- Step 1, sign in: already signed in.
- Step 2, callback address: `http://localhost:8787/callback`. GitHub accepts a localhost callback.
- Step 3, register the app: the form matched the guide (Application name, Homepage URL, optional description, Authorization callback URL, Enable Device Flow off).
- Step 4, client secret: **GitHub asked for a one-time code before it made the secret.** The guide did not say this. GitHub calls it sudo mode: it applies when you generate or remove a client secret, and lasts two hours. The guide now has this in the step and as a pitfall.
- Steps 3 and 4 together took about 2 minutes (16:44 to 16:46 UTC). The guide estimate is 3 to 7 minutes.
- Code then checked the new client ID: GitHub's authorize endpoint accepted it and sent the browser to sign-in (HTTP 302).
- The client secret was first pasted into the agent chat in place of the client ID. The two values sit near each other on the app page. The secret was replaced. The guide now says what each value looks like (client ID starts with `Ov23li`, the secret is 40 characters).

Not done: step 5, a full sign-in through the app and a code-for-token exchange. Steps 1, 3 and 4 are marked `Tested by hand` in the guide. Steps 2 and 5 stay sourced.

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

- [x] GitHub OAuth app on a free account (Div): see above.
- [ ] Slack app with public distribution on a free workspace (Div): time taken, screens, surprises.

No credentials are recorded here or anywhere in the repo.
