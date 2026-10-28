import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Public_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"] });
const body = Public_Sans({ variable: "--font-body", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OAuth App Guides",
  description:
    "How hard it is to get your own OAuth app approved, how long it takes, and which steps your agent can do for you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <header className="site-header">
          <Link href="/" className="wordmark">
            OAuth App Guides
          </Link>
          <nav>
            <Link href="/evidence">How we checked</Link>
            <a href="/llms.txt">For agents</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
