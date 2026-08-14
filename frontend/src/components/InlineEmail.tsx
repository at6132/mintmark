"use client";

import { FormEvent, useState } from "react";
import { homeContent } from "@/data/home";

export function InlineEmail() {
  const cfg = homeContent.email as Record<string, unknown>;
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const style = {
    ["--ara-email-bg" as string]: String(cfg.background_color || "#f2f8f6"),
    ["--ara-email-text" as string]: String(cfg.text_color || "#161b2e"),
    ["--ara-email-muted" as string]: String(cfg.muted_text_color || "#646575"),
    ["--ara-email-accent" as string]: String(cfg.accent_color || "#176d5c"),
    ["--ara-email-border" as string]: String(cfg.border_color || "#176d5c"),
    ["--ara-email-field" as string]: String(cfg.field_color || "#f7fcfa"),
    ["--ara-email-button" as string]: String(cfg.button_color || "#176d5c"),
    ["--ara-email-button-text" as string]: String(cfg.button_text_color || "#ffffff"),
    ["--ara-email-max" as string]: String(cfg.max_width || "1700px"),
    ["--ara-email-top" as string]: `${cfg.padding_top || 30}px`,
    ["--ara-email-bottom" as string]: `${cfg.padding_bottom || 30}px`,
    ["--ara-email-heading-size" as string]: `${cfg.desktop_heading_size || 22}px`,
    ["--ara-email-description-size" as string]: `${cfg.desktop_description_size || 14}px`,
    ["--ara-email-input-size" as string]: `${cfg.desktop_input_size || 13}px`,
    ["--ara-email-button-size" as string]: `${cfg.desktop_button_size || 10}px`,
    ["--ara-email-message-size" as string]: `${cfg.desktop_message_size || 11}px`,
    ["--ara-email-mobile-heading-size" as string]: `${cfg.mobile_heading_size || 11}px`,
    ["--ara-email-mobile-description-size" as string]: `${cfg.mobile_description_size || 12}px`,
    ["--ara-email-mobile-input-size" as string]: `${cfg.mobile_input_size || 13}px`,
    ["--ara-email-mobile-button-size" as string]: `${cfg.mobile_button_size || 10}px`,
    ["--ara-email-mobile-message-size" as string]: `${cfg.mobile_message_size || 11}px`,
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg(String(cfg.success_message || "You are on the list."));
      setEmail("");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ara-inline-email" style={style}>
      <div className="ara-inline-email__inner">
        <div className="ara-inline-email__intro">
          {cfg.heading ? <h2>{String(cfg.heading)}</h2> : null}
          {cfg.description ? <p>{String(cfg.description)}</p> : null}
        </div>
        <form className="ara-inline-email__form" onSubmit={onSubmit}>
          <label className="visually-hidden" htmlFor="AraInlineEmailField">
            Email address
          </label>
          <input
            id="AraInlineEmailField"
            className="ara-inline-email__input"
            type="email"
            required
            placeholder={String(cfg.placeholder || "Email address")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <button type="submit" className="ara-inline-email__button" disabled={busy}>
            {busy ? "JOINING…" : String(cfg.button_label || "JOIN THE PAPER")}
          </button>
          {msg ? <p className="ara-inline-email__message">{msg}</p> : null}
        </form>
      </div>
    </section>
  );
}
