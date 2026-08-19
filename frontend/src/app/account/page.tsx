import { Suspense } from "react";
import { AccountDesk } from "@/components/AccountDesk";

export default function AccountPage() {
  return (
    <Suspense>
      <AccountDesk />
    </Suspense>
  );
}
