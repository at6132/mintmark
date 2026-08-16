"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { siteContent } from "@/data/site";
import { assets, appHref } from "@/lib/assets";
import { CartProvider, useCart } from "@/lib/cart";
import { AuthProvider, useAuth } from "@/lib/auth";
import { BodyTemplateClass } from "@/components/BodyTemplateClass";

function TopBar() {
  const tb = siteContent.topBar as Record<string, unknown>;
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);

  const style = {
    ["--ara-topbar-bg" as string]: String(tb.background_color || "#F2F8F6"),
    ["--ara-topbar-text" as string]: String(tb.text_color || "#161b2e"),
    ["--ara-topbar-muted" as string]: String(tb.muted_text_color || "#646575"),
    ["--ara-topbar-accent" as string]: String(tb.accent_color || "#176d5c"),
    ["--ara-topbar-rule" as string]: String(tb.rule_color || "#1fa88f"),
    ["--ara-topbar-max" as string]: String(tb.max_width || "1700px"),
    ["--ara-topbar-padding" as string]: `${tb.vertical_padding || 11}px`,
    ["--ara-topbar-font-size" as string]: `${tb.desktop_font_size || 12}px`,
    ["--ara-topbar-mobile-font-size" as string]: `${tb.mobile_font_size || 9}px`,
  };

  return (
    <section className="ara-mintmark-top-bar" style={style}>
      <div className="ara-mintmark-top-bar__inner">
        <div className="ara-mintmark-top-bar__left">
          {tb.show_date ? <span>{dateLabel || "\u00a0"}</span> : null}
        </div>
        {tb.center_text ? (
          <div className="ara-mintmark-top-bar__center">
            <span aria-hidden="true" />
            <strong>{String(tb.center_text)}</strong>
            <span aria-hidden="true" />
          </div>
        ) : null}
        <div className="ara-mintmark-top-bar__right">
          {tb.show_account !== false ? <AccountLink fallback={String(tb.account_label || "MEMBER LOGIN")} /> : null}
        </div>
      </div>
    </section>
  );
}

function AccountLink({ fallback }: { fallback: string }) {
  const { member, ready } = useAuth();
  const label = ready && member ? member.name.split(" ")[0].toUpperCase() : fallback;
  return (
    <Link href="/account">
      <span>{label}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none">
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M5.5 19c.8-3.7 3.1-5.6 6.5-5.6s5.7 1.9 6.5 5.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  );
}

function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const h = siteContent.header as Record<string, unknown>;
  const nav = (siteContent.header.nav || []) as Array<{
    title: string;
    subtitle?: string;
    href?: string;
  }>;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const style = {
    ["--ara-header-bg" as string]: "#000000",
    ["--ara-header-paper" as string]: "#000000",
    ["--ara-header-text" as string]: "#ffffff",
    ["--ara-header-muted" as string]: String(h.subtitle_color || "#c76b73"),
    ["--ara-header-accent" as string]: String(h.accent_color || "#176d5c"),
    ["--ara-header-gold" as string]: String(h.gold_color || "#e0a526"),
    ["--ara-header-blue" as string]: String(h.blue_color || "#3a5be0"),
    ["--ara-header-rule" as string]: String(h.rule_color || "#1fa88f"),
    ["--ara-header-border" as string]: String(h.border_color || "#c9bea8"),
    ["--ara-header-max" as string]: String(h.max_width || "1700px"),
    ["--ara-header-padding" as string]: `${h.vertical_padding || 18}px`,
    ["--ara-logo-width" as string]: `${h.logo_width || 220}px`,
    ["--ara-logo-mobile-width" as string]: `${h.mobile_logo_width || 180}px`,
    ["--ara-header-nav-size" as string]: `${h.desktop_nav_size || 12}px`,
    ["--ara-header-subtitle-size" as string]: `${h.desktop_subtitle_size || 9}px`,
    ["--ara-header-mobile-nav-size" as string]: `${h.mobile_nav_size || 30}px`,
    ["--ara-header-mobile-subtitle-size" as string]: `${h.mobile_subtitle_size || 10}px`,
  };

  return (
    <header className="ara-mintmark-header" style={style}>
      <div className="ara-mintmark-header__inner">
        <Link href="/" className="ara-mintmark-header__logo" aria-label="Mintmark">
          <img
            src={assets.logo}
            className="ara-mintmark-header__logo-image"
            width={900}
            height={200}
            alt="Mintmark"
          />
        </Link>

        <nav className="ara-mintmark-header__desktop-nav" aria-label="Main navigation">
          {nav.map((item, i) => {
            const href = appHref(item.href) || "/";
            return (
              <Link key={item.title} className="ara-mintmark-header__nav-link" href={href}>
                <span className="ara-mintmark-header__nav-index">0{i + 1}</span>
                <span className="ara-mintmark-header__nav-copy">
                  <span className="ara-mintmark-header__nav-title">{item.title}</span>
                  {item.subtitle ? (
                    <span className="ara-mintmark-header__nav-subtitle">{item.subtitle}</span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="ara-mintmark-header__actions">
          {h.action_label ? (
            <Link className="ara-mintmark-header__action-link" href={appHref(String(h.action_link || "")) || "/bookshelf"}>
              {String(h.action_label)}
            </Link>
          ) : null}

          <Link href="/cart" className="ara-mintmark-header__cart" aria-label="Cart">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {count > 0 ? <span className="ara-mintmark-header__cart-count">{count}</span> : null}
          </Link>

          <button
            type="button"
            className="ara-mintmark-header__menu-button"
            aria-expanded={open}
            aria-controls="AraMintmarkMobileMenu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div id="AraMintmarkMobileMenu" className="ara-mintmark-header__mobile-menu" hidden={!open}>
        <div className="ara-mintmark-header__mobile-menu-inner">
          <div className="ara-mintmark-header__mobile-topline">
            <span>{String(h.mobile_menu_label || "EXPLORE MINTMARK")}</span>
            {h.mobile_menu_note ? <small>{String(h.mobile_menu_note)}</small> : null}
          </div>
          <div className="ara-mintmark-header__mobile-links">
            {nav.map((item, i) => (
              <Link
                key={item.title}
                className="ara-mintmark-header__mobile-link"
                href={appHref(item.href) || "/"}
              >
                <span className="ara-mintmark-header__mobile-index">0{i + 1}</span>
                <span className="ara-mintmark-header__mobile-copy">
                  <span>{item.title}</span>
                  {item.subtitle ? <small>{item.subtitle}</small> : null}
                </span>
              </Link>
            ))}
          </div>
          {h.action_label ? (
            <Link
              className="ara-mintmark-header__mobile-action"
              href={appHref(String(h.action_link || "")) || "/bookshelf"}
            >
              {String(h.action_label)}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const f = siteContent.footer as Record<string, unknown>;
  const year = new Date().getFullYear();
  const cols = siteContent.footerLinks || [];

  const style = {
    ["--ara-footer-bg" as string]: String(f.background_color || "#161b2e"),
    ["--ara-footer-text" as string]: String(f.text_color || "#f2f8f6"),
    ["--ara-footer-muted" as string]: String(f.muted_text_color || "#a7afbe"),
    ["--ara-footer-accent" as string]: String(f.accent_color || "#1fa88f"),
    ["--ara-footer-gold" as string]: String(f.gold_color || "#e0a526"),
    ["--ara-footer-border" as string]: String(f.border_color || "#2f3951"),
    ["--ara-footer-max" as string]: String(f.max_width || "1700px"),
    ["--ara-footer-top" as string]: `${f.padding_top || 70}px`,
    ["--ara-footer-bottom" as string]: `${f.padding_bottom || 40}px`,
    ["--ara-footer-logo-size" as string]: `${f.desktop_logo_size || 20}px`,
    ["--ara-footer-logo-width" as string]: `${f.logo_width || 330}px`,
    ["--ara-footer-mobile-logo-width" as string]: `${f.mobile_logo_width || 250}px`,
    ["--ara-footer-emblem-width" as string]: `${f.emblem_width || 100}px`,
    ["--ara-footer-statement-size" as string]: `${f.desktop_statement_size || 40}px`,
    ["--ara-footer-column-heading-size" as string]: `${f.desktop_column_heading_size || 16}px`,
    ["--ara-footer-link-size" as string]: `${f.desktop_link_size || 13}px`,
    ["--ara-footer-bottom-size" as string]: `${f.desktop_bottom_size || 12}px`,
    ["--ara-footer-mobile-logo-size" as string]: `${f.mobile_logo_size || 20}px`,
    ["--ara-footer-mobile-statement-size" as string]: `${f.mobile_statement_size || 28}px`,
    ["--ara-footer-mobile-column-heading-size" as string]: `${f.mobile_column_heading_size || 9}px`,
    ["--ara-footer-mobile-link-size" as string]: `${f.mobile_link_size || 12}px`,
    ["--ara-footer-mobile-bottom-size" as string]: `${f.mobile_bottom_size || 9}px`,
  };

  return (
    <footer className="ara-mintmark-footer" style={style}>
      <div className="ara-mintmark-footer__inner">
        <div className="ara-mintmark-footer__brand">
          <div className="ara-mintmark-footer__brand-row">
            <Link href="/" className="ara-mintmark-footer__logo" aria-label="Mintmark">
              <img
                src={assets.logo}
                className="ara-mintmark-footer__logo-image"
                alt="Mintmark"
                width={1000}
                height={220}
              />
            </Link>
          </div>
          {f.statement ? <p>{String(f.statement)}</p> : null}
        </div>

        <div className="ara-mintmark-footer__links">
          {cols.filter((col) => String(col.heading).toUpperCase() !== "READ").map((col) => (
            <div key={col.heading} className="ara-mintmark-footer__column">
              <h2>{col.heading}</h2>
              <nav aria-label={col.heading}>
                {col.links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.title}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="ara-mintmark-footer__bottom">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>
              © {year} Mintmark. {String(f.copyright_text || "All rights reserved.")}
            </span>
            <small style={{ fontSize: "0.8em", opacity: 0.7 }}>
              Mintmark is an independent publication. All company names, logos, and trademarks are the property of their
              respective owners and are used for identification and educational purposes only.
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <BodyTemplateClass />
        <TopBar />
        <Header />
        <main id="MainContent" className="content-for-layout">
          {children}
        </main>
        <Footer />
      </CartProvider>
    </AuthProvider>
  );
}
