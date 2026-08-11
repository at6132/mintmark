"use client";

import { FormEvent, useState } from "react";
import { homeContent } from "@/data/home";

export function InlineEmail() {
  const cfg = homeContent.email;
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

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
      setMsg(cfg.success_message);
      setEmail("");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="email-strip">
      <div className="email-strip__inner">
        <div>
          <h2>{cfg.heading}</h2>
          <p>{cfg.description}</p>
        </div>
        <form className="email-form" onSubmit={onSubmit}>
          <input
            type="email"
            required
            placeholder={cfg.placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label={cfg.placeholder}
          />
          <button type="submit" disabled={busy}>
            {busy ? "JOINING…" : cfg.button_label}
          </button>
        </form>
      </div>
      {msg ? (
        <div className="shell">
          <p className="form-msg">{msg}</p>
        </div>
      ) : null}
    </section>
  );
}
