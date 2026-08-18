import { Suspense } from "react";
import { AdminDesk } from "@/components/AdminDesk";

export default function AdminPage() {
  return (
    <Suspense>
      <AdminDesk />
    </Suspense>
  );
}
