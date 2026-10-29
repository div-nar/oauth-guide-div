import Link from "next/link";

export function ViewToggle({ human, machine, current }: { human: string; machine: string; current: "human" | "machine" }) {
  return (
    <nav className="view-toggle" aria-label="Choose view">
      <Link href={human} aria-current={current === "human" ? "page" : undefined}>Human</Link>
      <Link href={machine} aria-current={current === "machine" ? "page" : undefined}>Machine</Link>
    </nav>
  );
}
