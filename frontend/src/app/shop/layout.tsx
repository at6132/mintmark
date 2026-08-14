import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description: "Printed Mintmark company digests, bound for the shelf.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
