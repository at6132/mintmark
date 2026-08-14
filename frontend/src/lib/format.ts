export function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}
