import { CopyButton } from "@/components/CopyButton";
import { ViewToggle } from "@/components/ViewToggle";
import { getBaseUrl } from "@/lib/base-url";
import { buildIndex } from "@/lib/llms";

export const dynamic = "force-dynamic";

export default async function HomeMachine() {
  const text = await buildIndex(await getBaseUrl());
  return (
    <main className="page">
      <div className="machine-bar">
        <span className="small muted">
          What agents read. Also at <a href="/llms.txt">/llms.txt</a>
        </span>
        <CopyButton text={text} label="Copy all" className="copy-btn" />
      </div>
      <pre className="machine">{text}</pre>
      <ViewToggle human="/" machine="/ai" current="machine" />
    </main>
  );
}
