import { Suspense } from "react";
import { AccountLedger } from "@/components/AccountLedger";

export default function AccountPage() {
  return (
    <Suspense>
      <AccountLedger />
    </Suspense>
  );
}
