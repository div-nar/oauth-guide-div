import Link from "next/link";

export function ViewToggle({ slug, current }: { slug: string; current: "human" | "machine" }) {
  return (
    <nav className="view-toggle" aria-label="Choose view">
      <Link href={`/guides/${slug}`} aria-current={current === "human" ? "page" : undefined}>
        Human
      </Link>
      <Link href={`/guides/${slug}/ai`} aria-current={current === "machine" ? "page" : undefined}>
        Machine
      </Link>
    </nav>
  );
}
