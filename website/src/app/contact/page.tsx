"use client";

import { FormEvent, useState } from "react";
import { contactContent } from "@/data/contact";
import { stripHtml } from "@/lib/format";

export default function ContactPage() {
  const { settings, channels } = contactContent;
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    topic: settings.topic_general,
    message: "",
  });

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
      setStatus(settings.success_message);
      setForm({ name: "", email: "", phone: "", topic: settings.topic_general, message: "" });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-section cream">
      <div className="shell contact-layout">
        <div>
          <p className="eyebrow">{settings.eyebrow}</p>
          <h1 style={{ whiteSpace: "pre-line" }}>{settings.heading}</h1>
          <p className="lede">{stripHtml(settings.description)}</p>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, letterSpacing: "0.12em", color: "var(--muted)" }}>
            {settings.desk_label} · {settings.response_time}
          </p>
          <p style={{ color: "var(--muted)", marginTop: 12, maxWidth: "48ch" }}>{settings.note}</p>
          <div className="channel-list">
            {channels.map((ch) => (
              <div key={ch.id} className="channel">
                <h3>{ch.heading}</h3>
                <p>{ch.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="form-panel">
          <p className="eyebrow">{settings.form_eyebrow}</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: "8px 0 18px" }}>
            {settings.form_heading}
          </h2>
          <form className="form-grid" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="name">{settings.name_label}</label>
              <input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="email">{settings.email_label}</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="phone">{settings.phone_label}</label>
              <input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="topic">{settings.topic_label}</label>
              <select
                id="topic"
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              >
                <option>{settings.topic_general}</option>
                <option>{settings.topic_books}</option>
                <option>{settings.topic_content}</option>
                <option>{settings.topic_partnerships}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="message">{settings.message_label}</label>
              <textarea
                id="message"
                required
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "SENDING…" : settings.button_label}
            </button>
            {status ? <p className="form-msg">{status}</p> : null}
          </form>
        </div>
      </div>
    </section>
  );
}
