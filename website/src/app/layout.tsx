import type { Metadata } from "next";
import { Alegreya, Inter } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";

/**
 * Live Mintmark store (rendered):
 *   Body + big hero headline → Alegreya serif
 *   Accent UI              → Inter
 *
 * Theme JSON lists Acme for "heading", but ara sections on Shopify resolve
 * the hero title as Alegreya in practice. Match the live screenshot.
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
    <html lang="en" className={`${alegreya.variable} ${inter.variable}`}>
      <body className={`${alegreya.className} template-index`}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
