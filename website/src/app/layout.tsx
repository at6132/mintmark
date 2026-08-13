import type { Metadata } from "next";
import { Alegreya, Inter, Fraunces, Space_Grotesk, Caveat } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";

/**
 * Mintmark type system:
 *   Display headlines      → Fraunces (high-contrast optical serif)
 *   Body / reading copy    → Alegreya serif
 *   Labels / tickers / nums → Space Grotesk (grotesque, tabular)
 *   Fallback accent        → Inter
 */
const alegreya = Alegreya({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-alegreya",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mintmark — Big Ideas for Small Readers",
    template: "%s · Mintmark",
  },
  description:
    "News that teaches. Information that digests. Education that impacts. Mintmark turns real company stories into clear financial understanding.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${alegreya.variable} ${inter.variable} ${fraunces.variable} ${spaceGrotesk.variable} ${caveat.variable}`}
    >
      <body className={`${alegreya.className} template-index`}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
