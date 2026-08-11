"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { siteContent } from "@/data/site";
import { CartProvider, useCart } from "@/lib/cart";

function TopBar() {
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

  return (
    <div className="topbar">
      <div className="topbar__inner">
        <span className="topbar__date">{dateLabel || "\u00a0"}</span>
        <span className="topbar__center">BUSINESS · MARKETS · MONEY</span>
        <Link href="/contact">MEMBER DESK</Link>
      </div>
    </div>
  );
}

function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const nav = siteContent.header.nav;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="logo" aria-label="Mintmark home">
          <span className="logo__mark" aria-hidden>
            MM
          </span>
          <span className="logo__word">
            MINTMARK
            <small>EDITORIAL EDITION</small>
          </span>
        </Link>

        <nav className="nav-desktop" aria-label="Main navigation">
          {nav.map((item, i) => {
            const href = item.href || "/";
            return (
              <Link
                key={item.title}
                href={href}
                className="nav-link"
                aria-current={pathname === href || pathname.startsWith(href + "/") ? "page" : undefined}
              >
                <span className="nav-index">0{i + 1}</span>
                <span>
                  <span className="nav-title">{item.title}</span>
                  {item.subtitle ? <span className="nav-subtitle">{item.subtitle}</span> : null}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          <Link href="/bookshelf" className="header-cta">
            {siteContent.header.action_label || "EXPLORE MINTMARK"}
          </Link>
          <Link href="/cart" className="cart-btn" aria-label={`Cart${count ? `, ${count} items` : ""}`}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {count > 0 ? <span className="cart-count">{count}</span> : null}
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-menu" data-open={open} hidden={!open}>
        <div className="shell" style={{ width: "100%" }}>
          {nav.map((item, i) => (
            <Link key={item.title} href={item.href || "/"}>
              <span className="nav-index">0{i + 1}</span>
              <span>
                <span className="nav-title">{item.title}</span>
                {item.subtitle ? <span className="nav-subtitle">{item.subtitle}</span> : null}
              </span>
            </Link>
          ))}
          <Link href="/shop">
            <span className="nav-index">05</span>
            <span>
              <span className="nav-title">SHOP</span>
              <span className="nav-subtitle">Physical Digests</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <Link href="/" className="logo" style={{ color: "#f2f8f6" }}>
            <span className="logo__mark">MM</span>
            <span className="logo__word">
              MINTMARK
              <small style={{ color: "#e0a526" }}>THE MINTMARK</small>
            </span>
          </Link>
          <p className="site-footer__statement">{siteContent.footer.statement}</p>
        </div>
        <div className="site-footer__links">
          {siteContent.footerLinks.map((col) => (
            <div key={col.heading}>
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
        <div className="site-footer__bottom">
          <div>
            <span>
              © {year} Mintmark. {siteContent.footer.copyright_text}
            </span>
            <small className="site-footer__disclaimer">
              Mintmark is an independent publication. All company names, logos, and trademarks are the property of their
              respective owners and are used for identification and educational purposes only.
            </small>
          </div>
          <span>{siteContent.footer.bottom_text}</span>
        </div>
      </div>
    </footer>
  );
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <TopBar />
      <Header />
      <main>{children}</main>
      <Footer />
    </CartProvider>
  );
}
