import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in or join the Mintmark ledger — the journal, the mint, and a press pass with your name on the plate.",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
