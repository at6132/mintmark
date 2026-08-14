"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { bookshelfContent } from "@/data/books";
import { appHref, assets } from "@/lib/assets";
import { useCart } from "@/lib/cart";
import { stripHtml } from "@/lib/format";

type Book = {
  id: string;
  type?: string;
  sector?: string;
  sector_label?: string;
  color?: string;
  spine_height?: number;
  spine_width?: number;
  status?: string;
  company_name?: string;
  spine_title?: string;
  volume?: string;
  ticker?: string;
  headquarters?: string;
  summary?: string;
  module_button_label?: string;
  module_link?: string;
  digest_title?: string;
  digest_price?: string;
  digest_note?: string;
};

export default function BookshelfPage() {
  const settings = bookshelfContent.settings as Record<string, unknown>;
  const volumes = (bookshelfContent.books as Book[]).filter((b) => b.type === "book" || b.company_name);
  const [sector, setSector] = useState("all");
  const [selectedId, setSelectedId] = useState(volumes[0]?.id || "");
  const { addItem } = useCart();

  const filtered = useMemo(() => {
    if (sector === "all") return volumes;
    return volumes.filter((b) => (b.sector || "other") === sector);
  }, [sector, volumes]);

  const selected = volumes.find((b) => b.id === selectedId) || filtered[0] || volumes[0];

  const style = {
    ["--ara-bw-bg" as string]: String(settings.background_color || "#F5EFE1"),
    ["--ara-bw-paper" as string]: String(settings.paper_color || "#FBF7EC"),
    ["--ara-bw-ink" as string]: String(settings.text_color || "#161B2E"),
    ["--ara-bw-muted" as string]: String(settings.muted_text_color || "#5D6170"),
    ["--ara-bw-mint" as string]: String(settings.mint_color || "#1FA88F"),
    ["--ara-bw-gold" as string]: String(settings.gold_color || "#E0A526"),
    ["--ara-bw-trim" as string]: String(settings.trim_color || "#E0A526"),
    ["--ara-bw-trim-secondary" as string]: String(settings.trim_secondary_color || "#1FA88F"),
    ["--ara-bw-radius" as string]: `${settings.corner_rounding || 18}px`,
    ["--ara-bw-blue" as string]: String(settings.blue_color || "#315888"),
    ["--ara-bw-deep" as string]: String(settings.blue_deep_color || "#161B2E"),
    ["--ara-bw-frame" as string]: String(settings.cabinet_color || "#176D5C"),
    ["--ara-bw-frame-dark" as string]: String(settings.cabinet_edge_color || "#121827"),
    ["--ara-bw-stage" as string]: String(settings.shelf_back_color || "#EAF3EE"),
    ["--ara-bw-max" as string]: String(settings.max_width || "1700px"),
    ["--ara-bw-top" as string]: `${settings.padding_top || 80}px`,
    ["--ara-bw-bottom" as string]: `${settings.padding_bottom || 80}px`,
    ["--ara-bw-heading-desktop" as string]: `${settings.desktop_heading_size || 72}px`,
    ["--ara-bw-body-desktop" as string]: `${settings.desktop_body_size || 16}px`,
    ["--ara-bw-label-desktop" as string]: `${settings.desktop_label_size || 9}px`,
    ["--ara-bw-title-desktop" as string]: `${settings.desktop_detail_title_size || 50}px`,
    ["--ara-bw-heading-mobile" as string]: `${settings.mobile_heading_size || 48}px`,
    ["--ara-bw-body-mobile" as string]: `${settings.mobile_body_size || 15}px`,
    ["--ara-bw-label-mobile" as string]: `${settings.mobile_label_size || 9}px`,
    ["--ara-bw-title-mobile" as string]: `${settings.mobile_detail_title_size || 38}px`,
  };

  const filters = [
    ["all", String(settings.filter_all_label || "ALL")],
    ["technology", String(settings.filter_technology_label || "TECHNOLOGY")],
    ["financials", String(settings.filter_financials_label || "FINANCIALS")],
    ["consumer", String(settings.filter_consumer_label || "CONSUMER")],
    ["other", String(settings.filter_other_label || "OTHER")],
  ];

  return (
    <div className="ara-bookshelf">
    <section className="ara-bookshelf-wall" style={style}>
      <div className="ara-bookshelf-wall__rules" aria-hidden="true" />
      <div className="ara-bookshelf-wall__inner">
        <header className="ara-bookshelf-wall__intro">
          <div className="ara-bookshelf-wall__intro-main">
            {settings.eyebrow ? (
              <p className="ara-bookshelf-wall__eyebrow">{String(settings.eyebrow)}</p>
            ) : null}
            {settings.heading ? (
              <h2 style={{ whiteSpace: "pre-line" }}>{String(settings.heading)}</h2>
            ) : null}
          </div>
          <div className="ara-bookshelf-wall__intro-side">
            {settings.description ? (
              <div className="ara-bookshelf-wall__description">
                <p>{stripHtml(String(settings.description))}</p>
              </div>
            ) : null}
            <div className="ara-bookshelf-wall__count">
              <strong>{String(volumes.length).padStart(2, "0")}</strong>
              <span>{String(settings.volume_count_label || "COMPANY VOLUMES")}</span>
            </div>
          </div>
        </header>

        <div className="ara-bookshelf-wall__toolbar">
          <div
            className="ara-bookshelf-wall__filters"
            role="group"
            aria-label={String(settings.filter_accessibility_label || "Filter")}
          >
            {filters.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={sector === id ? "is-active" : undefined}
                aria-pressed={sector === id}
                onClick={() => setSector(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="ara-bookshelf-wall__display">
          <aside className="ara-bookshelf-wall__selected" aria-live="polite">
            {selected ? (
              <>
                <div className="ara-bookshelf-wall__selected-top">
                  <span>{selected.volume}</span>
                  <span>{selected.sector_label}</span>
                </div>
                <div className="ara-bookshelf-wall__selected-monogram">
                  {(selected.company_name || "?").charAt(0)}
                </div>
                <p className="ara-bookshelf-wall__selected-label">
                  {String(settings.detail_eyebrow || "SELECTED COMPANY")}
                </p>
                <h3>{selected.company_name}</h3>
                <div className="ara-bookshelf-wall__selected-meta">
                  <span>{selected.ticker}</span>
                  <span>{selected.headquarters}</span>
                </div>
                <p className="ara-bookshelf-wall__selected-summary">{selected.summary}</p>
                <div className="ara-bookshelf-wall__selected-action">
                  {selected.module_link ? (
                    <Link href={appHref(selected.module_link) || "#"}>
                      {selected.module_button_label || "OPEN COMPANY FILE"}
                    </Link>
                  ) : (
                    <span>{selected.status || "COMING SOON"}</span>
                  )}
                </div>
                <div className="ara-bookshelf-wall__digest">
                  <img src={assets.bookplate} alt="" width={240} height={160} />
                  <div>
                    <span>{String(settings.digest_panel_heading || "THE COMPANY DIGEST")}</span>
                    <strong>{selected.digest_title}</strong>
                    <em>{selected.digest_price}</em>
                    <p>{selected.digest_note}</p>
                    <button
                      type="button"
                      disabled={selected.status !== "AVAILABLE"}
                      onClick={() =>
                        addItem({
                          id: (selected.company_name || "digest").toLowerCase().replace(/\s+/g, "-"),
                          title: selected.digest_title || "Digest",
                          price: 24,
                          company: selected.company_name,
                        })
                      }
                    >
                      {selected.status === "AVAILABLE" ? "ADD TO CART" : "COMING SOON"}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </aside>

          <div className="ara-bookshelf-wall__stage">
            <div className="ara-bookshelf-wall__books" role="list">
              {volumes.map((book) => {
                const dim = !filtered.some((f) => f.id === book.id);
                const monogram = (book.company_name || "?").charAt(0);
                const unavailable = book.status !== "AVAILABLE";
                return (
                  <button
                    key={book.id}
                    type="button"
                    className={`ara-bookshelf-wall__book ara-bookshelf-wall__book--${book.color || "green"}${
                      selected?.id === book.id ? " is-selected" : ""
                    }${unavailable ? " ara-bookshelf-wall__book--unavailable" : ""}`}
                    style={{
                      ["--ara-book-height" as string]: `${book.spine_height || 400}px`,
                      ["--ara-book-width" as string]: `${book.spine_width || 72}px`,
                      ["--ara-book-height-mobile" as string]: `${Math.round((book.spine_height || 400) * 0.76)}px`,
                      ["--ara-book-width-mobile" as string]: `${Math.round((book.spine_width || 72) * 0.9)}px`,
                      opacity: dim ? 0.25 : undefined,
                      pointerEvents: dim ? "none" : undefined,
                    }}
                    onClick={() => setSelectedId(book.id)}
                    role="listitem"
                    aria-pressed={selected?.id === book.id}
                  >
                    <span className="ara-bookshelf-wall__book-cap" aria-hidden="true" />
                    <span className="ara-bookshelf-wall__book-volume">{book.volume}</span>
                    <span className="ara-bookshelf-wall__book-name">
                      {book.spine_title || book.company_name}
                    </span>
                    <span className="ara-bookshelf-wall__book-monogram">{monogram}</span>
                    <span className="ara-bookshelf-wall__book-status">{book.status}</span>
                  </button>
                );
              })}
            </div>
            <div className="ara-bookshelf-wall__shelf" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}
