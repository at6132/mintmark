import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description: "Internal Mintmark ops console — orders, customers, catalog, fulfillment.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
