<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# OAuth Guide: rules for agents that work on this repo

This site tells developers how to create and get approval for their own OAuth app with a provider. Agents are the main readers, so the Markdown at `/guides/<app>.md` is the product. The web page is the human fallback.

## Commands

- Run all checks before a commit: `bun test`, `bunx tsc --noEmit`, `bun run lint`, `bun run build`.
- Run the site: `bun run dev`. Agent-written guides need Postgres (`DATABASE_URL`).
- The dev server can serve old CSS after you edit `app/globals.css`. Stop `next dev`, delete `.next/dev`, then start it again.

## Rules

- **Evidence on every claim.** Use `sourced` with the official page, or `uncertain` with the reason. Only a person marks a claim `tested`, after a real setup.
- **Never guess protocol facts** (PKCE, callback matching, token lifetime). They differ by provider, and the code of the developer depends on them. Cite the docs of the provider, or mark the fact as unconfirmed.
- **The Markdown follows the order of the page:** Before you begin, Steps, Common pitfalls, Troubleshooting, Protocol, Questions, Configuration. When you change one, change the other, and update `lib/llms.ts`.
- **Write in ASD-STE100 Simplified Technical English.** Use one idea in each sentence and 20 words or fewer. Use the active voice. Do not use contractions or idioms. Code and identifiers are exempt.
- **Steps are short.** A step has at most two sentences. Put more detail in `technical`.
- **Composio appears only in "Can't wait?"** Code reads it from the Composio toolkit page. The research agent never looks at Composio.
- **Curated guides** are JSON in `data/guides`. Agent-written guides are in Postgres. One app has one guide, keyed by its website.
