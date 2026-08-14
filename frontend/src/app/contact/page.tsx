"use client";

import { FormEvent, useState } from "react";
import { contactContent } from "@/data/contact";
import { stripHtml } from "@/lib/format";

export default function ContactPage() {
  const settings = contactContent.settings as Record<string, unknown>;
  const channels = contactContent.channels as Array<Record<string, string>>;
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    topic: String(settings.topic_general || "General question"),
    message: "",
  });

  const style = {
    ["--ara-contact-bg" as string]: String(settings.background_color || "#F5EFE1"),
    ["--ara-contact-paper" as string]: String(settings.paper_color || "#FBF7EC"),
    ["--ara-contact-ink" as string]: String(settings.text_color || "#161B2E"),
    ["--ara-contact-muted" as string]: String(settings.muted_text_color || "#646575"),
    ["--ara-contact-mint" as string]: String(settings.mint_color || "#1FA88F"),
    ["--ara-contact-gold" as string]: String(settings.gold_color || "#E0A526"),
    ["--ara-contact-rule" as string]: String(settings.border_color || "#C9BEA8"),
    ["--ara-contact-max" as string]: String(settings.max_width || "1500px"),
    ["--ara-contact-top" as string]: `${settings.padding_top || 75}px`,
    ["--ara-contact-bottom" as string]: `${settings.padding_bottom || 100}px`,
    ["--ara-contact-heading-desktop" as string]: `${settings.desktop_heading_size || 72}px`,
    ["--ara-contact-body-desktop" as string]: `${settings.desktop_body_size || 16}px`,
    ["--ara-contact-label-desktop" as string]: `${settings.desktop_label_size || 10}px`,
    ["--ara-contact-heading-mobile" as string]: `${settings.mobile_heading_size || 48}px`,
    ["--ara-contact-body-mobile" as string]: `${settings.mobile_body_size || 15}px`,
    ["--ara-contact-label-mobile" as string]: `${settings.mobile_label_size || 9}px`,
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setStatus(String(settings.success_message || "Thank you."));
      setForm({
        name: "",
        email: "",
        phone: "",
        topic: String(settings.topic_general || "General question"),
        message: "",
      });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ara-contact ara-contact-editorial" style={style}>
      <div className="ara-contact-editorial__inner">
        <header className="ara-contact-editorial__intro">
          <div>
            {settings.eyebrow ? (
              <p className="ara-contact-editorial__eyebrow">{String(settings.eyebrow)}</p>
            ) : null}
            {settings.heading ? (
              <h1 style={{ whiteSpace: "pre-line" }}>{String(settings.heading)}</h1>
            ) : null}
          </div>
          {settings.description ? (
            <div className="ara-contact-editorial__description">
              <p>{stripHtml(String(settings.description))}</p>
            </div>
          ) : null}
        </header>

        <div className="ara-contact-editorial__layout">
          <aside className="ara-contact-editorial__desk">
            <div className="ara-contact-editorial__desk-head">
              <span>{String(settings.desk_label || "READER DESK")}</span>
              <strong>{String(settings.response_time || "")}</strong>
            </div>
            <div className="ara-contact-editorial__channels">
              {channels.map((ch, i) => (
                <article key={ch.id} className="ara-contact-editorial__channel">
                  <span>0{i + 1}</span>
                  <div>
                    <h2>{ch.heading}</h2>
                    <p>{ch.text}</p>
                    {ch.link_label ? (
                      <a href="#contact-form">
                        {ch.link_label} <span aria-hidden="true">→</span>
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
            {settings.note ? <p className="ara-contact-editorial__note">{String(settings.note)}</p> : null}
          </aside>

          <div className="ara-contact-editorial__form-panel" id="contact-form">
            <div className="ara-contact-editorial__form-head">
              <span>{String(settings.form_eyebrow || "")}</span>
              <h2>{String(settings.form_heading || "")}</h2>
            </div>
            <form className="ara-contact-editorial__form" onSubmit={onSubmit}>
              {status ? <div className="ara-contact-editorial__success">{status}</div> : null}
              <div className="ara-contact-editorial__row">
                <label>
                  <span>{String(settings.name_label || "NAME")}</span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span>{String(settings.email_label || "EMAIL")}</span>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                  />
                </label>
              </div>
              <label>
                <span>{String(settings.phone_label || "PHONE")}</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </label>
              <label>
                <span>{String(settings.topic_label || "TOPIC")}</span>
                <select value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}>
                  <option>{String(settings.topic_general || "General question")}</option>
                  <option>{String(settings.topic_books || "Books and fulfilment")}</option>
                  <option>{String(settings.topic_content || "Educational content")}</option>
                  <option>{String(settings.topic_partnerships || "Press and partnerships")}</option>
                </select>
              </label>
              <label>
                <span>{String(settings.message_label || "MESSAGE")}</span>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={6}
                />
              </label>
              <button type="submit" disabled={busy}>
                {busy ? "SENDING…" : String(settings.button_label || "SEND MESSAGE")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
