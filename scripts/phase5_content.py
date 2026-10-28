"""Phase 5 content: per-use-case paths, Composio managed-app notes, 'already have an app' sections."""
import json
import sys
from pathlib import Path

D = Path(sys.argv[1])
MANAGED = {"url": "https://docs.composio.dev/toolkits/managed-auth", "title": "Composio: managed OAuth apps"}
TRADEOFFS = {"url": "https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app", "title": "Composio: managed vs custom auth"}


def ev(level, *sources, note=None):
    e = {"level": level, "sources": list(sources)}
    if note:
        e["note"] = note
    return e


def src(url, title):
    return {"url": url, "title": title}


def link(url, label):
    return {"url": url, "label": label, "prefilled": False}


def managed(app, extra=""):
    return {
        "managedApp": "yes",
        "note": f"You can connect users today with Composio's own {app} app while yours is set up or in review. Users see 'Composio' on the consent screen, rate limits are shared with other Composio customers, and polling triggers run at most every 15 minutes. Switch to your own app when it is ready.{extra}",
        "evidence": ev("sourced", MANAGED, TRADEOFFS),
    }


def load(slug):
    return json.loads((D / f"{slug}.json").read_text())


def save(slug, g):
    (D / f"{slug}.json").write_text(json.dumps(g, indent=2, ensure_ascii=False) + "\n")


def paths(g, mapping):
    for u in g["useCases"]:
        u["stepIds"] = mapping[u["id"]]


# GitHub
g = load("github")
GH = src("https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app", "GitHub Docs: Creating an OAuth app")
paths(g, {"repos": []})
g["composio"] = managed("GitHub")
g["existingApp"] = {
    "summary": "Reuse it. Add Composio's redirect address as an extra callback URL (an OAuth app can have up to 10), then paste the client ID and a client secret into Composio. Generate a separate secret for Composio so you can revoke it without touching your product.",
    "steps": [],
    "reReviewTriggers": [
        {"trigger": "Your callback list is full", "effect": "An OAuth app holds at most 10 callback URLs. Remove an unused one or register a second app.", "evidence": ev("sourced", GH)},
        {"trigger": "You want a separate secret for Composio", "effect": "GitHub lets you generate another client secret on the app's page; the existing one keeps working until you delete it.", "evidence": ev("uncertain", note="From GitHub's app settings screen; not confirmed on a docs page we read.")},
        {"trigger": "You need more permissions", "effect": "No review. GitHub OAuth apps ask for scopes when the user connects, so users just see a new approval screen.", "evidence": ev("uncertain", note="GitHub's scope docs were not part of this check.")},
    ],
}
save("github", g)

# Slack
g = load("slack")
MANI = src("https://docs.slack.dev/app-manifests/configuring-apps-with-app-manifests", "Slack: Configuring apps with manifests")
REV = src("https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide", "Slack Marketplace review guide")
RL = src("https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps", "Slack changelog: rate limits for non-Marketplace apps")
paths(g, {
    "post": ["sign-in", "create-app", "redirect-scopes", "distribute", "credentials", "test"],
    "read": [],
    "internal": ["sign-in", "create-app", "redirect-scopes", "credentials", "test"],
})
g["composio"] = managed("Slack", " Check whether Composio's managed Slack app is Marketplace-listed before relying on it for reading history; we could not confirm that.")
g["existingApp"] = {
    "summary": "Add Composio's redirect address under OAuth & Permissions, then paste the existing client ID and secret into Composio. Existing installs keep working.",
    "steps": [],
    "reReviewTriggers": [
        {"trigger": "You add permissions", "effect": "New scopes only apply after each workspace reinstalls the app.", "evidence": ev("sourced", MANI)},
        {"trigger": "Your app is already in the Slack Marketplace and you change permissions", "effect": "Resubmit for review: the functional review takes up to 6 weeks for published apps.", "evidence": ev("sourced", REV)},
        {"trigger": "Your app is unlisted and gets new installs", "effect": "Installs made after May 29, 2025 are throttled when reading history, even if the app itself is older.", "evidence": ev("sourced", RL)},
    ],
}
save("slack", g)

# Gmail
g = load("gmail")
RS = src("https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification", "Google: Restricted scope verification")
paths(g, {
    "read": [],
    "send": ["sign-in", "enable-api", "consent-screen", "client", "secret", "test-users", "domain", "policy-video", "submit", "review"],
    "internal": ["sign-in", "enable-api", "consent-screen", "client", "secret", "test-users"],
})
g["composio"] = managed("Gmail", " This is the realistic way to pilot Gmail during Google's weeks of review.")
g["existingApp"] = {
    "summary": "Add Composio's redirect address to your existing OAuth client, or create a second client in the same project. Either way you keep the verification your project already has, as long as the permissions stay the same.",
    "steps": [],
    "reReviewTriggers": [
        {"trigger": "You add a restricted permission you were not verified for", "effect": "Google re-verifies the app, and a new restricted scope can require a new security assessment.", "evidence": ev("sourced", RS)},
        {"trigger": "You change the app name, logo or domains users see", "effect": "Brand verification runs again, typically 2 to 3 business days.", "evidence": ev("sourced", RS)},
        {"trigger": "A second client in the same project", "effect": "It sits under the same consent screen, so it should not need its own verification.", "evidence": ev("uncertain", note="Our reading of how verification attaches to the project's consent screen; not stated outright on the page.")},
    ],
}
save("gmail", g)

# HubSpot
g = load("hubspot")
CA = src("https://developers.hubspot.com/docs/apps/developer-platform/build-apps/create-an-app", "HubSpot: Create an app")
if not any(s["id"] == "own-token" for s in g["steps"]):
    g["steps"].append({
        "id": "own-token", "owner": "human", "title": "Copy the access token into Composio (your own account only)",
        "plain": "For a private app on your own account there is no sign-in flow: copy the app's access token and add it to Composio as a token-based connection.",
        "technical": "Set auth.type to \"static\" in app-hsmeta.json and remove redirectUrls. After hs project upload, copy the access token from the app's Auth tab.",
        "whyHuman": "The token is a password for your account. Paste it yourself.",
        "minutes": {"min": 2, "max": 5},
        "link": link("https://app.hubspot.com/developer", "Open your HubSpot developer projects"),
        "evidence": ev("sourced", CA),
    })
paths(g, {"customers": ["sign-in", "create-project", "configure", "upload", "credentials", "test"], "own": ["sign-in", "create-project", "upload", "own-token"]})
g["composio"] = managed("HubSpot")
g["existingApp"] = {
    "summary": "Add Composio's redirect address to auth.redirectUrls in app-hsmeta.json, run hs project upload, then paste the client ID and secret into Composio.",
    "steps": [],
    "reReviewTriggers": [
        {"trigger": "You change the app's uid", "effect": "HubSpot treats it as a different app, so existing installs do not carry over. Keep the uid.", "evidence": ev("sourced", CA)},
        {"trigger": "You add required scopes", "effect": "Accounts that already installed the app need to reinstall to grant the new scopes.", "evidence": ev("uncertain", note="Not stated on the pages we read.")},
        {"trigger": "Your app is listed on the HubSpot Marketplace", "effect": "Listing changes go back through HubSpot's Ecosystem Quality review.", "evidence": ev("uncertain", note="Inferred from the listing process; not stated for changes.")},
    ],
}
save("hubspot", g)

# LinkedIn
g = load("linkedin")
GA = src("https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access", "LinkedIn: Getting access")
CM = src("https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview", "LinkedIn: Community Management overview")
ids = {s["id"] for s in g["steps"]}
if "apply-partner" not in ids:
    g["steps"] += [
        {"id": "apply-partner", "owner": "human", "title": "Apply to the partner program (ads, sales or recruiting)",
         "plain": "Each area is its own program: add the Advertising API product from your app's Products tab, or apply to Sales Navigator (SNAP) or the Talent partner programs.",
         "whyHuman": "LinkedIn reviews your business and use case.",
         "minutes": {"min": 30, "max": 90},
         "link": link("https://www.linkedin.com/developers/apps", "Open your app, then Products"),
         "evidence": ev("sourced", GA)},
        {"id": "partner-review", "owner": "waiting", "title": "LinkedIn reviews your partner application",
         "plain": "LinkedIn does not publish how long partner reviews take.",
         "waitDays": {"min": 14, "max": 90},
         "evidence": ev("uncertain", GA, note="The programs are sourced; the wait is our estimate.")},
        {"id": "closed-permission", "owner": "human", "title": "Reading a person's own posts is closed",
         "plain": "LinkedIn is not accepting requests for r_member_social. There is no path to this access today; design around it.",
         "link": link("https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview", "Read LinkedIn's note on r_member_social"),
         "evidence": ev("sourced", CM)},
    ]
base = ["sign-in", "create-app", "verify-page", "open-products", "redirect-credentials"]
paths(g, {"member": base, "pages": base + ["apply-cm", "vetting"], "partners": ["sign-in", "create-app", "verify-page", "redirect-credentials", "apply-partner", "partner-review"], "member-read": ["closed-permission"]})
g["composio"] = managed("LinkedIn", " LinkedIn Ads is a separate Composio toolkit that needs your own app.")
g["existingApp"] = {
    "summary": "Add Composio's redirect address on your app's Auth tab and paste the client ID and secret into Composio. Products you already have approved carry over.",
    "steps": [],
    "reReviewTriggers": [
        {"trigger": "You want Community Management on an app that already has other products", "effect": "LinkedIn only accepts Community Management requests from a new app with no other products. Create a second app tied to the same Page.", "evidence": ev("sourced", CM)},
        {"trigger": "You need a new partner product (ads, sales, recruiting)", "effect": "Each product needs its own application and approval, even on an approved app.", "evidence": ev("sourced", GA)},
    ],
}
save("linkedin", g)
print("ok")
