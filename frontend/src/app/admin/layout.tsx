import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Desk",
  description: "Mintmark press desk — orders, customers, catalog, and the working paper.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
