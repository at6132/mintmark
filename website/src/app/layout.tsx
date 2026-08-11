import type { Metadata } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";

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
    <html lang="en">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
