"""One-off Phase 1 content pass: use cases, direct links, Slack/LinkedIn/Gmail corrections."""
import json
import sys
import urllib.parse
from pathlib import Path

D = Path(sys.argv[1])
COMPOSIO = "https://dashboard.composio.dev/~/project/auth-configs"
REDIRECT = "https://backend.composio.dev/api/v3/toolkits/auth/callback"


def src(url, title):
    return {"url": url, "title": title}


def ev(level, *sources, note=None):
    e = {"level": level, "sources": list(sources)}
    if note:
        e["note"] = note
    return e


def link(url, label, prefilled=False):
    return {"url": url, "label": label, "prefilled": prefilled}


def load(slug):
    return json.loads((D / f"{slug}.json").read_text())


def save(slug, g):
    for s in g["steps"]:
        s.pop("url", None)
    (D / f"{slug}.json").write_text(json.dumps(g, indent=2, ensure_ascii=False) + "\n")


def set_links(g, links):
    for s in g["steps"]:
        if s["id"] in links:
            s["link"] = links[s["id"]]


# ---------------- GitHub ----------------
g = load("github")
GH_DOC = src("https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app", "GitHub Docs: Creating an OAuth app")
g["useCases"] = [
    {"id": "repos", "label": "Read or change code, issues and pull requests", "difficulty": "easy",
     "handsOnMinutes": {"min": 5, "max": 15}, "waitDays": {"min": 0, "max": 0},
     "summary": "No review. Users in organisations may need their org owner to approve your app.",
     "scopes": ["repo", "read:user"], "evidence": ev("sourced", GH_DOC)},
]
set_links(g, {
    "sign-in": link("https://github.com/login", "Sign in to GitHub"),
    "get-redirect": link(COMPOSIO, "Open Composio auth configs"),
    "register-app": link("https://github.com/settings/applications/new", "Open GitHub's new OAuth app form"),
    "secret": link("https://github.com/settings/developers", "Open your GitHub OAuth apps"),
    "test": link(COMPOSIO, "Open Composio auth configs"),
})
for s in g["steps"]:
    if s["id"] == "register-app":
        s["technical"] += " For an organisation-owned app use https://github.com/organizations/YOUR-ORG/settings/applications/new."
save("github", g)

# ---------------- Slack ----------------
g = load("slack")
RL = src("https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps", "Slack changelog: rate limits for non-Marketplace apps")
REV = src("https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide", "Slack Marketplace review guide")
DIST = src("https://docs.slack.dev/distribution/", "Slack: Distributing your app")
MAN = src("https://docs.slack.dev/app-manifests/configuring-apps-with-app-manifests", "Slack: Configuring apps with manifests")
manifest = {
    "display_information": {"name": "Your agent's name"},
    "oauth_config": {
        "redirect_urls": [REDIRECT],
        "scopes": {"bot": ["chat:write", "channels:read", "channels:history", "users:read"]},
    },
    "settings": {"org_deploy_enabled": False, "token_rotation_enabled": False},
}
prefill = "https://api.slack.com/apps?new_app=1&manifest_json=" + urllib.parse.quote(json.dumps(manifest, separators=(",", ":")))

g["verdict"] = {
    "difficulty": "hard",
    "handsOnMinutes": {"min": 60, "max": 180},
    "waitDays": {"min": 14, "max": 80},
    "summary": "Posting messages is self-serve in minutes. Reading messages at a useful rate needs a Slack Marketplace listing: new unlisted apps can only read history once a minute, 15 messages at a time.",
}
g["useCases"] = [
    {"id": "post", "label": "Post messages and replies", "difficulty": "easy",
     "handsOnMinutes": {"min": 15, "max": 30}, "waitDays": {"min": 0, "max": 0},
     "summary": "Create the app and switch on public distribution. No review. Steps 1 to 6.",
     "scopes": ["chat:write"], "evidence": ev("sourced", DIST)},
    {"id": "read", "label": "Read channel history or threads (summaries, search, triage)", "difficulty": "hard",
     "handsOnMinutes": {"min": 60, "max": 180}, "waitDays": {"min": 14, "max": 80},
     "summary": "Unlisted apps created after May 29, 2025 get 1 request a minute and 15 messages per request on conversations.history and conversations.replies. Lifting that needs a Marketplace listing: 10+ active installs, then up to 10 business days plus up to 10 weeks of review.",
     "scopes": ["channels:history", "groups:history"], "evidence": ev("sourced", RL, REV)},
    {"id": "internal", "label": "Only inside your own company's workspace", "difficulty": "easy",
     "handsOnMinutes": {"min": 10, "max": 20}, "waitDays": {"min": 0, "max": 0},
     "summary": "Internal apps are not throttled and need no distribution or review.",
     "scopes": ["chat:write", "channels:history"], "evidence": ev("sourced", RL)},
]
g["whoYouNeed"].append({"role": "10 or more real customer workspaces (for reading messages)", "why": "Slack only reviews Marketplace apps that already have 10 active installs."})
for s in g["steps"]:
    if s["id"] == "create-app":
        s["title"] = "Create the app from a pre-filled link"
        s["plain"] = "One link opens Slack's 'Create app' screen with Composio's redirect address and the usual agent permissions already filled in. Change the name, pick your workspace, remove permissions you don't need, and create."
        s["technical"] = "Uses Slack's manifest URL (api.slack.com/apps?new_app=1&manifest_json=...). Bot scopes pre-filled: chat:write, channels:read, channels:history, users:read. Redirect URL: " + REDIRECT + " (check it matches your Composio auth config)."
        s["evidence"] = ev("sourced", MAN, src("https://docs.slack.dev/reference/app-manifest", "Slack: App manifest reference"))
    if s["id"] == "redirect-scopes":
        s["title"] = "Check the redirect address and permissions"
        s["plain"] = "Under OAuth & Permissions, confirm the redirect address matches your Composio auth config and the permission list is what your agent needs."
set_links(g, {
    "sign-in": link("https://api.slack.com/apps", "Open Slack's app dashboard"),
    "create-app": link(prefill, "Create the app with settings pre-filled", True),
    "redirect-scopes": link("https://api.slack.com/apps", "Open your app, then OAuth & Permissions"),
    "distribute": link("https://api.slack.com/apps", "Open your app, then Manage Distribution"),
    "credentials": link(COMPOSIO, "Open Composio auth configs"),
    "test": link(COMPOSIO, "Open Composio auth configs"),
})
g["steps"] += [
    {"id": "installs", "owner": "human", "title": "Reach 10 active workspaces (reading only)",
     "plain": "Get the app installed and used in at least 10 workspaces in the last 28 days. Until then you can't apply for the Marketplace, and reading stays throttled for new installs.",
     "whyHuman": "These have to be real customers or pilots, not your own test workspaces.",
     "minutes": {"min": 30, "max": 120},
     "link": link("https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide", "Read Slack's review requirements"),
     "evidence": ev("sourced", REV)},
    {"id": "submit-marketplace", "owner": "human", "title": "Submit to the Slack Marketplace (reading only)",
     "plain": "Submit from your app's settings with a demo video (install, sign-in, use, uninstall), a test account with dummy data, and a reason for each permission.",
     "whyHuman": "The video and test account need a person. An agent can draft the permission justifications.",
     "minutes": {"min": 60, "max": 120},
     "link": link("https://api.slack.com/apps", "Open your app, then Submit to Slack Marketplace"),
     "evidence": ev("sourced", REV)},
    {"id": "slack-review", "owner": "waiting", "title": "Slack reviews your app (reading only)",
     "plain": "A preliminary review takes up to 10 business days, then a functional review takes up to 10 weeks for new apps. Resubmitting during the preliminary stage resets your place in the queue.",
     "waitDays": {"min": 14, "max": 80},
     "evidence": ev("sourced", REV, note="Slack gives upper bounds only. The 14-day minimum is our estimate.")},
]
g["forks"] = [f for f in g["forks"] if not f["condition"].startswith("You want a listing")]
g["forks"].insert(0, {"condition": "Your agent only posts messages",
                      "effect": "Stop after step 6. Throttling only affects reading history and threads, so no Marketplace listing is needed.",
                      "evidence": ev("sourced", RL)})
g["nuances"].insert(0, {
    "title": "Unlisted apps read Slack slowly",
    "detail": "Since May 29, 2025, commercially distributed apps outside the Marketplace get 1 request a minute and at most 15 messages per call on conversations.history and conversations.replies. Internal apps keep 50+ requests a minute and 1,000 messages.",
    "ifStuck": "For pilots, read only recent messages or run as an internal app in each customer's workspace. For scale, plan the Marketplace listing early.",
    "evidence": ev("sourced", RL, note="Slack's changelog exempts existing installs of older apps. Slack's FAQ reportedly extends the limits to existing installs from March 3, 2026; we have not confirmed that on Slack's own page.")})
save("slack", g)

# ---------------- Gmail ----------------
g = load("gmail")
RS = src("https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification", "Google: Restricted scope verification")
SC = src("https://developers.google.com/workspace/gmail/api/auth/scopes", "Gmail API scopes")
UV = src("https://support.google.com/cloud/answer/7454865", "Google: Unverified apps")
g["useCases"] = [
    {"id": "read", "label": "Read, sort or draft replies to email", "difficulty": "hard",
     "handsOnMinutes": {"min": 90, "max": 240}, "waitDays": {"min": 14, "max": 60},
     "summary": "Restricted access: Google verification plus a yearly third-party security assessment.",
     "scopes": ["gmail.readonly", "gmail.modify", "gmail.compose"], "evidence": ev("sourced", SC, RS)},
    {"id": "send", "label": "Send email only", "difficulty": "moderate",
     "handsOnMinutes": {"min": 45, "max": 120}, "waitDays": {"min": 3, "max": 21},
     "summary": "gmail.send is sensitive, not restricted: Google verification but no security assessment.",
     "scopes": ["gmail.send"],
     "evidence": ev("uncertain", SC, note="The scope class is sourced. Google gives no duration for sensitive-scope verification, so the wait is our estimate.")},
    {"id": "internal", "label": "Only people in your own Google Workspace", "difficulty": "easy",
     "handsOnMinutes": {"min": 15, "max": 30}, "waitDays": {"min": 0, "max": 0},
     "summary": "Mark the app Internal. No verification needed.",
     "scopes": ["gmail.readonly"], "evidence": ev("sourced", UV)},
]
for s in g["steps"]:
    if s["id"] == "casa":
        s["title"] = "Security assessment (yearly)"
        s["plain"] = "Apps that reach restricted Gmail data through a server, not just the user's browser, need an assessment by a Google-approved assessor. When Composio fetches email for your agent, the data passes through Composio's servers under your app, so expect this to apply. Google's Trust and Safety team contacts you when it's time, and you repeat it every 12 months."
        s["evidence"]["note"] = "The requirement and yearly repeat are sourced. That Composio relaying data triggers it for your app is our reading, not confirmed by Google or Composio. Google gives no price or duration; 7 to 30 days is a guess."
set_links(g, {
    "sign-in": link("https://console.cloud.google.com/projectcreate", "Create a Google Cloud project"),
    "enable-api": link("https://console.cloud.google.com/apis/library/gmail.googleapis.com", "Open the Gmail API page"),
    "consent-screen": link("https://console.cloud.google.com/auth/branding", "Open the consent screen settings"),
    "client": link("https://console.cloud.google.com/auth/clients/create", "Create an OAuth client"),
    "secret": link("https://console.cloud.google.com/auth/clients", "Open your OAuth clients"),
    "test-users": link("https://console.cloud.google.com/auth/audience", "Add test users"),
    "domain": link("https://search.google.com/search-console", "Open Search Console"),
    "policy-video": link("https://studio.youtube.com", "Open YouTube Studio to upload as Unlisted"),
    "submit": link("https://console.cloud.google.com/auth/verification", "Open verification center"),
})
save("gmail", g)

# ---------------- HubSpot ----------------
g = load("hubspot")
CA = src("https://developers.hubspot.com/docs/apps/developer-platform/build-apps/create-an-app", "HubSpot: Create an app")
g["useCases"] = [
    {"id": "customers", "label": "Work in your customers' HubSpot accounts", "difficulty": "moderate",
     "handsOnMinutes": {"min": 30, "max": 60}, "waitDays": {"min": 0, "max": 0},
     "summary": "Built with the HubSpot CLI. No review, but installers accept an 'unverified app' warning until you list on the Marketplace.",
     "scopes": ["crm.objects.contacts.read", "crm.objects.contacts.write"], "evidence": ev("sourced", CA)},
    {"id": "own", "label": "Only your own company's HubSpot", "difficulty": "easy",
     "handsOnMinutes": {"min": 10, "max": 20}, "waitDays": {"min": 0, "max": 0},
     "summary": "Use a private app with a static token. No OAuth redirect needed.",
     "scopes": ["crm.objects.contacts.read"], "evidence": ev("sourced", CA)},
]
DOCLINK = link("https://developers.hubspot.com/docs/apps/developer-platform/build-apps/create-an-app", "Open HubSpot's CLI steps")
set_links(g, {
    "sign-in": link("https://developers.hubspot.com/get-started", "Open HubSpot developer sign-up"),
    "create-project": DOCLINK, "configure": DOCLINK, "upload": DOCLINK,
    "credentials": link("https://app.hubspot.com/developer", "Open your HubSpot developer projects"),
    "test": link(COMPOSIO, "Open Composio auth configs"),
})
save("hubspot", g)

# ---------------- LinkedIn ----------------
g = load("linkedin")
GA = src("https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access", "LinkedIn: Getting access")
CM = src("https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview", "LinkedIn: Community Management overview")
g["verdict"] = {
    "difficulty": "easy",
    "handsOnMinutes": {"min": 20, "max": 30},
    "waitDays": {"min": 0, "max": 0},
    "summary": "Signing people in and posting as them is self-serve once a company Page admin confirms your app. Company pages, ads, sales and recruiting need LinkedIn's partner approval.",
}
g["useCases"] = [
    {"id": "member", "label": "Sign people in, or post as the person who connected", "difficulty": "easy",
     "handsOnMinutes": {"min": 20, "max": 30}, "waitDays": {"min": 0, "max": 0},
     "summary": "Self-serve products. Steps 1 to 5.", "scopes": ["openid", "profile", "email", "w_member_social"],
     "evidence": ev("sourced", GA)},
    {"id": "pages", "label": "Post for, or read analytics from, company pages", "difficulty": "gated",
     "handsOnMinutes": {"min": 45, "max": 90}, "waitDays": {"min": 7, "max": 60},
     "summary": "Community Management API: vetted Development tier, then Standard tier with a screen recording.",
     "scopes": ["w_organization_social", "r_organization_social"], "evidence": ev("sourced", CM)},
    {"id": "partners", "label": "Ads, Sales Navigator or recruiting", "difficulty": "gated",
     "handsOnMinutes": {"min": 60, "max": 120}, "waitDays": {"min": 14, "max": 90},
     "summary": "Separate partner programs, each with a business review.", "scopes": [],
     "evidence": ev("uncertain", GA, note="Programs are sourced. LinkedIn publishes no timelines; the wait is our estimate.")},
    {"id": "member-read", "label": "Read a person's own posts", "difficulty": "gated",
     "handsOnMinutes": {"min": 0, "max": 0}, "waitDays": {"min": 0, "max": 0},
     "summary": "Closed: LinkedIn is not accepting requests for r_member_social.", "scopes": ["r_member_social"],
     "evidence": ev("sourced", CM)},
]
g["forks"] = [f for f in g["forks"] if not f["condition"].startswith("Your agent only signs")]
for s in g["steps"]:
    if s["id"] == "vetting":
        s["title"] = "LinkedIn vets your application (company pages only)"
set_links(g, {
    "sign-in": link("https://www.linkedin.com/developers/apps", "Open LinkedIn Developer Portal"),
    "create-app": link("https://www.linkedin.com/developers/apps/new", "Create a LinkedIn app"),
    "verify-page": link("https://www.linkedin.com/developers/apps", "Open your app, then Settings"),
    "open-products": link("https://www.linkedin.com/developers/apps", "Open your app, then Products"),
    "redirect-credentials": link("https://www.linkedin.com/developers/apps", "Open your app, then Auth"),
    "apply-cm": link("https://learn.microsoft.com/en-us/linkedin/marketing/quick-start", "Read LinkedIn's apply-for-access steps"),
})
save("linkedin", g)
print("ok")
