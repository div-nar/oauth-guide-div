import Link from "next/link";
import { GenerateFeed } from "@/components/GenerateFeed";

export default async function GeneratePage({ searchParams }: PageProps<"/generate">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const job = typeof sp.job === "string" && /^\d+$/.test(sp.job) ? Number(sp.job) : null;
  return (
    <main className="page">
      <nav className="crumbs small" aria-label="Breadcrumb">
        <Link href="/">guides</Link> <span aria-hidden>/</span> <span>researching</span>
      </nav>
      <h1 className="research-title">Researching {q || "an app"}</h1>
      <p className="lede">
        An agent is reading {q ? `${q}'s` : "the provider's"} official developer docs and writing the guide. Every
        search and page it reads shows up below.
      </p>
      <GenerateFeed query={q} jobId={job} />
    </main>
  );
}
