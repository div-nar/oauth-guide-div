"""Phase 6 content: 'Blocked or rejected?' sections, each from the provider's own pages."""
import json
import sys
from pathlib import Path

D = Path(sys.argv[1])


def ev(*sources, note=None):
    e = {"level": "sourced", "sources": list(sources)}
    if note:
        e["note"] = note
    return e


def src(url, title):
    return {"url": url, "title": title}


def esc(url, label):
    return {"url": url, "label": label}


def blocker(symptom, cause, fix, evidence, escalate=None, use_cases=None):
    return {"symptom": symptom, "cause": cause, "fix": fix, "escalate": escalate, "useCaseIds": use_cases, "evidence": evidence}


GH_RESTRICT = src("https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions", "GitHub: About OAuth app access restrictions")
GH_APPROVE = src("https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/approving-oauth-apps-for-your-organization", "GitHub: Approving OAuth apps for your organization")
GH_ERRORS = src("https://docs.github.com/en/apps/oauth-apps/maintaining-oauth-apps/troubleshooting-authorization-request-errors", "GitHub: Troubleshooting authorization request errors")

G_BRAND = src("https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification", "Google: Brand verification")
G_SENSITIVE = src("https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification", "Google: Sensitive scope verification")
G_ISSUES = src("https://support.google.com/cloud/answer/13804782", "Google Cloud: Examples of common issues")

S_REVIEW = src("https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide", "Slack Marketplace review guide")
S_APPROVAL = src("https://slack.com/help/articles/222386767-Manage-app-approval-for-your-workspace", "Slack: Manage app approval for your workspace")

H_LISTING = src("https://developers.hubspot.com/docs/apps/developer-platform/list-apps/listing-your-app/app-marketplace-listing-requirements", "HubSpot: App Marketplace listing requirements")

L_REVIEW = src("https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review", "LinkedIn: Community Management app review")

BLOCKERS = {
    "github": [
        blocker(
            "Your app only sees an organisation's public repositories",
            "New GitHub organisations turn on OAuth app access restrictions by default. Until an owner approves your app, members cannot grant it access to the organisation's private data.",
            "Each user requests approval for your app when they authorise it. An organisation owner approves it under the organisation's Third-party access settings. Tell users this before they connect.",
            ev(GH_RESTRICT, GH_APPROVE),
            esc(GH_APPROVE["url"], "GitHub: how owners approve an OAuth app"),
        ),
        blocker(
            "Sign-in fails with redirect_uri_mismatch",
            "The redirect address sent during sign-in does not match the callback URL registered on your OAuth app.",
            "Copy the redirect URI from your Composio auth config into the app's Authorization callback URL field exactly, then try again.",
            ev(GH_ERRORS),
            esc(GH_ERRORS["url"], "GitHub: authorization request errors"),
        ),
    ],
    "gmail": [
        blocker(
            "Google's automated brand check lists problems",
            "Your home page must be public (not behind a login), describe the app and link to the privacy policy. The privacy policy must be on the same domain and explain how you use Google data. Your domain must be verified in Google Search Console.",
            "Fix each listed issue and run verification again, or request a manual review (usually 2 to 3 business days). Cancel verification before changing branding, and publish within 7 days of a passing result.",
            ev(G_BRAND),
            esc(G_BRAND["url"], "Google: brand verification"),
        ),
        blocker(
            "Your review seems stuck",
            "Google's Trust & Safety team may email you for more information, and the review pauses until you answer.",
            "Check the developer contact and support email addresses on your consent screen, including spam. Check the Verification Center for a paused status, and reply on the same email thread.",
            ev(G_BRAND, G_SENSITIVE),
            esc(G_SENSITIVE["url"], "Google: verification and Trust & Safety follow-up"),
            ["read", "send"],
        ),
        blocker(
            "Verification is refused because of a policy flag",
            "A project on your account was flagged for a Terms of Service violation, or your domain is marked dangerous in Google Search.",
            "Resolve the flagged project and appeal in the Google Cloud console, or fix the Search Console issues and request a security review. Resubmit only after that review finishes.",
            ev(G_ISSUES),
            esc(G_ISSUES["url"], "Google Cloud: common verification issues"),
            ["read", "send"],
        ),
    ],
    "slack": [
        blocker(
            "Slack won't let you submit to the Marketplace",
            "Apps need at least 10 active workspace installs before they can be submitted.",
            "Distribute the app directly (shareable install link) to customer workspaces until you reach 10 active installs, then submit.",
            ev(S_REVIEW),
            esc(S_REVIEW["url"], "Slack Marketplace review guide"),
            ["read"],
        ),
        blocker(
            "Your Marketplace submission is sent back",
            "Common reasons: scopes for features you have not built yet, scopes you cannot justify, install problems, or bugs that block testing. Reviewers cannot get into your workspaces.",
            "Address each point of the feedback in your app settings and resubmit. Request only the scopes you use today, and give reviewers a test account and a way to install the app themselves. Your queue place resets if you resubmit during the preliminary review.",
            ev(S_REVIEW),
            esc(S_REVIEW["url"], "Slack Marketplace review guide"),
            ["read"],
        ),
        blocker(
            "A customer can't install your app",
            "Their workspace requires admin approval for apps, or has restricted yours.",
            "Ask the customer to request the app and have a workspace owner or app manager approve it. Restricted apps cannot be requested at all.",
            ev(S_APPROVAL),
            esc(S_APPROVAL["url"], "Slack: app approval for workspaces"),
            ["post", "read"],
        ),
    ],
    "hubspot": [
        blocker(
            "You can't list on the App Marketplace yet",
            "Listing needs at least three active installs: HubSpot accounts unconnected to your company that made successful API calls through your app in the last 30 days.",
            "Install the app directly for three customer accounts first, using your install link, and keep them active before you submit.",
            ev(H_LISTING),
            esc(H_LISTING["url"], "HubSpot: listing requirements"),
            ["customers"],
        ),
        blocker(
            "Your listing is set back to Draft or rejected",
            "Missing, incorrect or misleading listing details, dead links, or scopes your app requests but does not use.",
            "Apply the feedback from the Ecosystem Quality team, remove unused scopes or mark them optional, and resubmit. The first review takes up to 10 business days; the whole cycle should finish within 60 days. Submit one app at a time: extra submissions are rejected automatically.",
            ev(H_LISTING),
            esc("https://community.hubspot.com/c/develop-build-integrate/apis-integrations/80", "HubSpot developer community"),
            ["customers"],
        ),
    ],
    "linkedin": [
        blocker(
            "Your Community Management access request is rejected",
            "LinkedIn vets the use case, a verified business email (personal addresses fail), your organisation, its website and domain, and that a super admin of your company Page verified the app.",
            "You cannot re-apply with the same app. Fix what failed, create a new app, and submit a new Development tier request.",
            ev(L_REVIEW),
            esc("https://www.linkedin.com/help/linkedin/ask/dsapi", "LinkedIn Developer Support"),
            ["pages"],
        ),
        blocker(
            "Your Standard tier upgrade is rejected",
            "The screencast did not show every use case on your form, the privacy policy was missing or invalid, or the app breaks LinkedIn's data storage rules.",
            "Record a high-resolution, narrated screencast of only your app showing each test case, then start again with a new app and a new Development tier request. The same app cannot re-apply.",
            ev(L_REVIEW),
            esc("https://www.linkedin.com/help/linkedin/ask/dsapi", "LinkedIn Developer Support"),
            ["pages"],
        ),
    ],
}

C_SLACK = src("https://docs.composio.dev/toolkits/slack", "Composio: Slack toolkit")
C_GMAIL = src("https://docs.composio.dev/toolkits/gmail", "Composio: Gmail toolkit")
C_LINKEDIN = src("https://docs.composio.dev/toolkits/linkedin", "Composio: LinkedIn toolkit")

# Which access Composio's own app does not cover, or its docs do not confirm.
COMPOSIO = {
    "slack": {
        "drop": " Check whether Composio's managed Slack app is Marketplace-listed before relying on it for reading history; we could not confirm that.",
        "limits": [{
            "useCaseIds": ["read"],
            "note": "Composio's own Slack app is not Marketplace-listed yet (Composio says its review is in progress), so reading history through it hits the same limits as any unlisted app, including at most 15 messages per request. It does not get you around the wait for reading.",
            "evidence": ev(C_SLACK),
        }],
    },
    "gmail": {
        "drop": " This is the realistic way to pilot Gmail during Google's weeks of review.",
        "limits": [{
            "useCaseIds": ["read", "send"],
            "note": "Composio's Gmail docs do not list which permissions its own app includes, and say Google blocks permissions it has not verified for that app. Connect a test account through Composio and check that your agent's actions work before relying on it.",
            "evidence": {"level": "uncertain", "sources": [C_GMAIL], "note": "The toolkit page confirms a managed app but not its permissions."},
        }],
    },
    "linkedin": {
        "drop": "",
        "limits": [{
            "useCaseIds": ["pages", "partners"],
            "note": "Composio's LinkedIn docs list company-page actions but do not say whether its own app includes company-page permissions, and some permissions cannot be combined in one app. Check before relying on it for company pages or partner-only APIs.",
            "evidence": {"level": "uncertain", "sources": [C_LINKEDIN], "note": "The toolkit page confirms a managed app but not its permissions."},
        }],
    },
}

# Forks that the blockers above now cover, phrased from what the developer sees.
REPLACED_FORKS = {
    "slack": "Your customer's workspace requires admin approval for apps",
    "github": "Your users connect accounts that belong to a GitHub organisation",
}

for slug, items in BLOCKERS.items():
    p = D / f"{slug}.json"
    g = json.loads(p.read_text())
    g["blockers"] = items
    g["forks"] = [f for f in g["forks"] if f["condition"] != REPLACED_FORKS.get(slug)]
    if slug in COMPOSIO:
        c = COMPOSIO[slug]
        g["composio"]["note"] = g["composio"]["note"].replace(c["drop"], "") if c["drop"] else g["composio"]["note"]
        g["composio"]["limits"] = c["limits"]
    p.write_text(json.dumps(g, indent=2, ensure_ascii=False) + "\n")
    print(slug, len(items))
