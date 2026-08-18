"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Mirrors Shopify theme.liquid body classes:
 *   template-{{ page_type }} template-suffix-{{ suffix }}
 * so ara-site-consistency + theme paper rules can target them.
 */
export function BodyTemplateClass() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const body = document.body;
    const prev = Array.from(body.classList).filter(
      (c) =>
        c.startsWith("template-") ||
        c.startsWith("page-handle-") ||
        c.startsWith("card-hover-effect-"),
    );
    for (const c of prev) body.classList.remove(c);

    body.classList.add("card-hover-effect-none");

    let pageType = "page";
    let suffix = "";
    let handle = "";

    if (pathname === "/") {
      pageType = "index";
    } else if (pathname.startsWith("/digests/")) {
      pageType = "article";
      handle = pathname.split("/").filter(Boolean).pop() || "";
    } else if (pathname.startsWith("/companies/")) {
      pageType = "page";
      suffix = "apple";
      handle = pathname.split("/").filter(Boolean).pop() || "apple";
    } else if (pathname === "/companies" || pathname === "/catalog" || pathname === "/cataloge") {
      pageType = "page";
      suffix = "cataloge";
      handle = "catalog";
    } else if (pathname === "/mint" || pathname === "/the-mint") {
      pageType = "page";
      suffix = "mint";
      handle = "mint";
    } else if (pathname === "/mission") {
      pageType = "page";
      suffix = "mission";
      handle = "mission";
    } else if (pathname === "/bookshelf") {
      pageType = "page";
      suffix = "bookshelf";
      handle = "bookshelf";
    } else if (pathname === "/contact") {
      pageType = "page";
      suffix = "contact";
      handle = "contact";
    } else if (pathname === "/account" || pathname === "/login" || pathname === "/signup") {
      pageType = "page";
      suffix = "account";
      handle = "account";
    } else if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      pageType = "page";
      suffix = "admin";
      handle = "admin";
    } else if (pathname === "/cart") {
      pageType = "cart";
      handle = "cart";
    } else if (pathname === "/shop") {
      pageType = "collection";
      handle = "shop";
    } else if (pathname.startsWith("/order")) {
      pageType = "page";
      handle = "order";
    } else {
      pageType = "page";
      handle = pathname.split("/").filter(Boolean).join("-") || "page";
    }

    body.classList.add(`template-${pageType}`);
    if (suffix) body.classList.add(`template-suffix-${suffix}`);
    if (handle) body.classList.add(`page-handle-${handle}`);
  }, [pathname]);

  return null;
}
