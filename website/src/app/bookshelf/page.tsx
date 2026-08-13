import { redirect } from "next/navigation";

// Bookshelf is merged into the catalog (renders as the vitrine at the top).
export default function BookshelfRedirect() {
  redirect("/catalog");
}
