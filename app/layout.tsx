import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OAuth App Guides",
  description:
    "How hard it is to get your own OAuth app approved, how long it takes, and which steps your agent can do for you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
        <header className="site-header">
          <Link href="/" className="wordmark">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 1 L23 12 L12 23 L1 12 Z" fill="currentColor" />
            </svg>
            <span className="slash" aria-hidden>/</span>
            OAuth Guides
          </Link>
          <nav>
            <Link href="/">Guides</Link>
            <Link href="/evidence">How we checked</Link>
            <a href="/llms.txt">For agents</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
