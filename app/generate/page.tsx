import { GenerateFeed } from "@/components/GenerateFeed";

export default async function GeneratePage({ searchParams }: PageProps<"/generate">) {
  const q = (await searchParams).q;
  const value = typeof q === "string" ? q : "";
  return (
    <main className="page">
      <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)" }}>Researching {value || "an app"}</h1>
      <p className="muted">
        An agent is reading the provider&apos;s developer docs and writing the guide. You can watch what it reads.
      </p>
      <GenerateFeed query={value} />
    </main>
  );
}
