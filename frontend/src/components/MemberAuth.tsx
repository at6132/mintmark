"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth";

type Mode = "sign-in" | "join";

/**
 * The one member sign-in / join form on the site. The account page and every
 * gated surface (the Bookshelf belt, for one) render this, so the fields, the
 * copy, the errors and the endpoints are identical wherever you sign in.
 */
export function MemberAuth({
  heading,
  note,
  compact = false,
}: {
  heading?: string;
  note?: string;
  compact?: boolean;
}) {
  const { refresh } = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(mode === "join" ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "join" ? form : { email: form.email, password: form.password },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign you in.");
      setForm({ name: "", email: "", password: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`mm-auth${compact ? " mm-auth--compact" : ""}`} onSubmit={onSubmit}>
      <div className="mm-auth__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "sign-in"}
          className={`mm-auth__tab${mode === "sign-in" ? " is-on" : ""}`}
          onClick={() => { setMode("sign-in"); setError(""); }}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "join"}
          className={`mm-auth__tab${mode === "join" ? " is-on" : ""}`}
          onClick={() => { setMode("join"); setError(""); }}
        >
          Become a member
        </button>
      </div>

      {heading ? <h3 className="mm-auth__h">{heading}</h3> : null}
      {note ? <p className="mm-auth__note">{note}</p> : null}

      {mode === "join" ? (
        <input
          className="mm-auth__input"
          required
          name="name"
          placeholder="Name"
          autoComplete="name"
          value={form.name}
          onChange={set("name")}
        />
      ) : null}
      <input
        className="mm-auth__input"
        required
        type="email"
        name="email"
        placeholder="Email"
        autoComplete="email"
        value={form.email}
        onChange={set("email")}
      />
      <input
        className="mm-auth__input"
        required
        type="password"
        name="password"
        placeholder="Password"
        autoComplete={mode === "join" ? "new-password" : "current-password"}
        value={form.password}
        onChange={set("password")}
      />

      {error ? <p className="mm-auth__err">{error}</p> : null}

      <button type="submit" className="mm-auth__submit" disabled={busy}>
        {busy ? "One moment…" : mode === "join" ? "Create my account" : "Sign in"}
      </button>
    </form>
  );
}
