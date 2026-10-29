import Link from "next/link";
import { GenerateFeed } from "@/components/GenerateFeed";

export default async function GeneratePage({ searchParams }: PageProps<"/generate">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const job = typeof sp.job === "string" && /^\d+$/.test(sp.job) ? Number(sp.job) : null;
  const exact = sp.exact === "1";
  const refresh = sp.refresh === "1";
  return (
    <main className="page">
      <nav className="crumbs small" aria-label="Breadcrumb">
        <Link href="/">guides</Link> <span aria-hidden>/</span> <span>researching</span>
      </nav>
      <h1 className="research-title">{refresh ? "Re-checking" : "Researching"} {q || "an app"}</h1>
      <p className="lede">
        An agent reads the official developer docs of {q || "the provider"} and writes the guide. Each search and
        each page that it reads shows below.
      </p>
      {/* Keyed on the query: picking one of several matches (Hinge -> Hinge Dating App)
          stays on this page, and the feed must start fresh rather than keep the old
          request and its list of choices. */}
      <GenerateFeed key={q} query={q} jobId={job} exact={exact} refresh={refresh} />
    </main>
  );
}
