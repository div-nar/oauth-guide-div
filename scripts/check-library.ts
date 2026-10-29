// Runs the no-account checks (links load, sign-in endpoint answers) on the
// hand-checked guides and records them in data/guides/*.json.
// Usage: bun run scripts/check-library.ts [slug ...]
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runChecks } from "@/lib/agent/checks";
import { listLibraryGuides } from "@/lib/library";

const only = process.argv.slice(2);
for (const g of listLibraryGuides().filter((x) => !only.length || only.includes(x.slug))) {
  const checks = await runChecks(g, (e) => e.type === "status" && console.log(`${g.slug}: ${e.text}`));
  const file = path.join(import.meta.dir, "..", "data", "guides", `${g.slug}.json`);
  const raw = JSON.parse(readFileSync(file, "utf8"));
  writeFileSync(file, JSON.stringify({ ...raw, checks }, null, 2) + "\n");
}
