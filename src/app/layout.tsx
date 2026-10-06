import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import DesktopGate from "@/components/ui/DesktopGate";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "RITESH CHESS — Play Smart. Think Ahead.",
  description: "Challenge the AI, play with friends, or compete in real-time chess matches.",
  other: {
    // Opt out of the Dark Reader browser extension: it injects data-darkreader-*
    // attributes after SSR, which causes React hydration mismatches. The app
    // ships its own dark theme, so we do not want it transformed.
    "darkreader-lock": "true",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable}`}
    >
      <body suppressHydrationWarning>
        <DesktopGate>{children}</DesktopGate>
      </body>
    </html>
  );
}
