"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { bookshelfContent } from "@/data/books";
import { useCart } from "@/lib/cart";
type Sector = "all" | "technology" | "financials" | "consumer" | "other";

export default function BookshelfPage() {
  const { settings, books } = bookshelfContent;
  const volumes = books.filter((b) => b.type === "book");
  const [sector, setSector] = useState<Sector>("all");
  const [selectedId, setSelectedId] = useState(volumes[0]?.id || "");
  const { addItem } = useCart();

  const filtered = useMemo(() => {
    if (sector === "all") return volumes;
    return volumes.filter((b) => (b.sector || "other") === sector);
  }, [sector, volumes]);

  const selected = volumes.find((b) => b.id === selectedId) || filtered[0] || volumes[0];

  const filters: { id: Sector; label: string }[] = [
    { id: "all", label: settings.filter_all_label },
    { id: "technology", label: settings.filter_technology_label },
    { id: "financials", label: settings.filter_financials_label },
    { id: "consumer", label: settings.filter_consumer_label },
    { id: "other", label: settings.filter_other_label },
  ];

  return (
    <section className="bookshelf page-section cream">
      <div className="shell">
        <div className="bookshelf__intro">
          <p className="eyebrow">{settings.eyebrow}</p>
          <h1 style={{ whiteSpace: "pre-line" }}>{settings.heading}</h1>
          <p className="lede" dangerouslySetInnerHTML={{ __html: settings.description }} />
          <div className="filters" role="toolbar" aria-label={settings.filter_accessibility_label}>
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                className="filter-btn"
                aria-pressed={sector === f.id}
                onClick={() => setSector(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cabinet">
          <div className="cabinet__head">
            <span>{settings.cabinet_heading}</span>
            <span>{settings.cabinet_note}</span>
          </div>
          <div className="shelf-track" aria-label="Company bookshelf">
            {volumes.map((book) => {
              const dim = !filtered.some((f) => f.id === book.id);
              return (
                <button
                  key={book.id}
                  type="button"
                  className={`book-spine book-spine--${book.color || "green"}${dim ? " is-dim" : ""}`}
                  style={{
                    height: book.spine_height || 400,
                    width: book.spine_width || 72,
                  }}
                  aria-pressed={selected?.id === book.id}
                  onClick={() => setSelectedId(book.id)}
                >
                  {book.spine_title}
                </button>
              );
            })}
          </div>
        </div>

        {selected ? (
          <div className="detail-panel">
            <div>
              <span className="detail-panel__status">
                {selected.status === "AVAILABLE" ? settings.available_label : settings.coming_soon_label}
              </span>
              <h2>{selected.company_name}</h2>
              <div className="detail-panel__meta">
                <span>{selected.volume}</span>
                <span>{selected.ticker}</span>
                <span>{selected.headquarters}</span>
                <span>{selected.sector_label}</span>
              </div>
              <p className="lede">{selected.summary}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                {selected.module_link ? (
                  <Link className="btn btn-primary" href={selected.module_link}>
                    {selected.module_button_label}
                  </Link>
                ) : (
                  <span className="btn btn-secondary" aria-disabled>
                    COMING SOON
                  </span>
                )}
                <Link className="btn btn-secondary" href="/mint">
                  ENTER THE MINT
                </Link>
              </div>
            </div>
            <div className="digest-card">
              <p className="eyebrow">{settings.digest_panel_heading}</p>
              <h3>{selected.digest_title}</h3>
              <p className="price">{selected.digest_price}</p>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>{selected.digest_note}</p>
              <button
                type="button"
                className="btn btn-mint"
                style={{ marginTop: 14, width: "100%" }}
                disabled={selected.status !== "AVAILABLE"}
                onClick={() =>
                  addItem({
                    id: selected.company_name.toLowerCase().replace(/\s+/g, "-"),
                    title: selected.digest_title,
                    price: 24,
                    company: selected.company_name,
                  })
                }
              >
                {selected.status === "AVAILABLE" ? "ADD TO CART" : settings.coming_soon_label}
              </button>
            </div>
          </div>
        ) : (
          <p>{settings.empty_message}</p>
        )}
      </div>
    </section>
  );
}
