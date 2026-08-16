"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { assets } from "@/lib/assets";
import { useAuth, type PublicMember } from "@/lib/auth";

type Mode = "sign-in" | "join";

const PRIVILEGES = [
  {
    num: "01",
    title: "Keep the edition",
    text: "The newsroom, the catalog, and every digest — signed in, with your name on the plate.",
  },
  {
    num: "02",
    title: "Collect the stamp",
    text: "Coins, the wallet, and curriculum in The Mint. Understanding is the authenticating mark.",
  },
  {
    num: "03",
    title: "Sit at the desk",
    text: "Orders, the bookshelf, and a press pass. A seat in the paper, not a mailing list.",
  },
];

function MintCoin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="mm-coin-gold" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#f6e2a4" />
          <stop offset="42%" stopColor="#e0a526" />
          <stop offset="100%" stopColor="#9a6d12" />
        </radialGradient>
        <radialGradient id="mm-coin-face" cx="50%" cy="46%" r="58%">
          <stop offset="0%" stopColor="#fff6d4" />
          <stop offset="55%" stopColor="#f0c75a" />
          <stop offset="100%" stopColor="#c4891a" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#mm-coin-gold)" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#7a5610" strokeWidth="1.4" opacity="0.55" />
      {Array.from({ length: 72 }).map((_, i) => {
        const a = (i / 72) * Math.PI * 2;
        const x1 = 100 + Math.cos(a) * 90;
        const y1 = 100 + Math.sin(a) * 90;
        const x2 = 100 + Math.cos(a) * 96;
        const y2 = 100 + Math.sin(a) * 96;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7a5610" strokeWidth="1.15" />;
      })}
      <circle cx="100" cy="100" r="78" fill="url(#mm-coin-face)" />
      <circle cx="100" cy="100" r="74" fill="none" stroke="#8a6414" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#161b2e" strokeWidth="2.4" opacity="0.88" />
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fill="#161b2e"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="52"
        fontWeight="700"
        letterSpacing="-1"
      >
        MM
      </text>
      <text
        x="100"
        y="44"
        textAnchor="middle"
        fill="#161b2e"
        fontFamily="system-ui, sans-serif"
        fontSize="9"
        fontWeight="700"
        letterSpacing="3.2"
      >
        MINTMARK
      </text>
      <text
        x="100"
        y="168"
        textAnchor="middle"
        fill="#161b2e"
        fontFamily="system-ui, sans-serif"
        fontSize="9"
        fontWeight="700"
        letterSpacing="2.4"
      >
        2026
      </text>
    </svg>
  );
}

function Colonnade({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 180" fill="none" aria-hidden="true">
      <path d="M28 62 L160 18 L292 62" stroke="currentColor" strokeWidth="1.6" />
      <path d="M40 62 H280" stroke="currentColor" strokeWidth="1.6" />
      <path d="M36 70 H284" stroke="currentColor" strokeWidth="1.2" />
      {Array.from({ length: 8 }).map((_, i) => {
        const x = 52 + i * 30;
        return <rect key={i} x={x} y="70" width="10" height="78" stroke="currentColor" strokeWidth="1.3" />;
      })}
      <path d="M24 148 H296" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 158 H304" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function formatJoined(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function PressPass({ member, onLogout }: { member: PublicMember; onLogout: () => void }) {
  return (
    <div className="ara-account__pass-wrap">
      <article className="ara-account__pass" aria-label="Mintmark press pass">
        <div className="ara-account__pass-shine" aria-hidden="true" />
        <header className="ara-account__pass-top">
          <span>EX LIBRIS</span>
          <span>{member.memberNo}</span>
        </header>
        <div className="ara-account__pass-body">
          <MintCoin className="ara-account__pass-coin" />
          <div>
            <p className="ara-account__pass-kicker">Press pass · The Ledger</p>
            <h2>{member.name}</h2>
            <p className="ara-account__pass-email">{member.email}</p>
            <p className="ara-account__pass-script">Understanding is the authenticating stamp.</p>
          </div>
        </div>
        <footer className="ara-account__pass-foot">
          <span>Issued {formatJoined(member.createdAt)}</span>
          <img src={assets.logo} alt="" width={180} height={40} />
        </footer>
      </article>
      <div className="ara-account__pass-actions">
        <Link href="/bookshelf">Browse the bookshelf</Link>
        <Link href="/mint">Enter the mint</Link>
        <button type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AccountLedger() {
  const search = useSearchParams();
  const { member, ready, refresh, logout } = useAuth();
  const [mode, setMode] = useState<Mode>(search.get("mode") === "join" ? "join" : "sign-in");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dateLabel, setDateLabel] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);

  useEffect(() => {
    if (search.get("mode") === "join") setMode("join");
  }, [search]);

  const heading = mode === "join" ? "Sign the plate." : "Open the ledger.";
  const formTitle = mode === "join" ? "Join the edition" : "Returning readers";
  const formEyebrow = mode === "join" ? "NEW MEMBER" : "MEMBER LOGIN";

  const style = useMemo(
        () =>
      ({
        ["--ara-account-bg" as string]: "#e9f6f0",
        ["--ara-account-paper" as string]: "#fffdf6",
        ["--ara-account-ink" as string]: "#161b2e",
        ["--ara-account-muted" as string]: "#646575",
        ["--ara-account-mint" as string]: "#1fa88f",
        ["--ara-account-mint-deep" as string]: "#176d5c",
        ["--ara-account-gold" as string]: "#e0a526",
        ["--ara-account-rule" as string]: "#c9bea8",
        ["--ara-account-max" as string]: "1500px",
      }) as CSSProperties,
    [],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "join" && form.password !== form.confirm) {
      setError("Those passwords don’t match.");
      return;
    }
    setBusy(true);
    try {
      const endpoint = mode === "join" ? "/api/auth/signup" : "/api/auth/login";
      const payload =
        mode === "join"
          ? { name: form.name, email: form.email, password: form.password }
          : { email: form.email, password: form.password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not open the ledger.");
      setForm({ name: "", email: "", password: "", confirm: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setShowPassword(false);
  }

  return (
    <section className="ara-account" style={style}>
      <div className="ara-account__inner">
        <header className="ara-account__folio">
          <span>Vol. I · No. 14</span>
          <strong>The Ledger</strong>
          <span>{dateLabel || "\u00a0"}</span>
        </header>

        <div className="ara-account__intro">
          <div>
            <p className="ara-account__eyebrow">Member desk</p>
            <h1>
              Take your seat at the{" "}
              <mark>
                <span className="mm-hl">desk</span>
              </mark>.
            </h1>
          </div>
          <p>
            The mintmark is the stamp that proves where a coin was struck. Here, it proves you belong to the
            edition — the journal, the mint, and the bookshelf with your name on the plate.
          </p>
        </div>

        <div className="ara-account__layout">
          <aside className="ara-account__desk">
            <div className="ara-account__desk-art" aria-hidden="true">
              <Colonnade className="ara-account__colonnade" />
              <MintCoin className="ara-account__desk-coin" />
              <img src={assets.mintEmblem} alt="" className="ara-account__emblem" width={120} height={80} />
            </div>
            <div className="ara-account__desk-head">
              <span>Reader privileges</span>
              <strong>Open desk</strong>
            </div>
            <div className="ara-account__channels">
              {PRIVILEGES.map((item) => (
                <article key={item.num} className="ara-account__channel">
                  <span>{item.num}</span>
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="ara-account__note">Big ideas for small readers. A seat at the desk, not a mailing list.</p>
          </aside>

          <div className="ara-account__form-panel">
            {ready && member ? (
              <PressPass member={member} onLogout={logout} />
            ) : (
              <>
                <div className="ara-account__form-head">
                  <div className="ara-account__tabs" role="tablist" aria-label="Account">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "sign-in"}
                      className={mode === "sign-in" ? "is-active" : undefined}
                      onClick={() => switchMode("sign-in")}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "join"}
                      className={mode === "join" ? "is-active" : undefined}
                      onClick={() => switchMode("join")}
                    >
                      Join
                    </button>
                  </div>
                  <span>{formEyebrow}</span>
                  <h2>{formTitle}</h2>
                  <p>{heading} Keep the edition. Collect the stamp.</p>
                </div>
                <form className="ara-account__form" onSubmit={onSubmit}>
                  {error ? (
                    <div className="ara-account__errors" role="alert">
                      {error}
                    </div>
                  ) : null}
                  {mode === "join" ? (
                    <label>
                      <span>Name on the plate</span>
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </label>
                  ) : null}
                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Password</span>
                    <span className="ara-account__secret">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={mode === "join" ? 8 : undefined}
                        autoComplete={mode === "join" ? "new-password" : "current-password"}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        aria-label="Password"
                      />
                      <button
                        type="button"
                        className="ara-account__reveal"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-pressed={showPassword}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </span>
                  </label>
                  {mode === "join" ? (
                    <label>
                      <span>Confirm password</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={form.confirm}
                        onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                      />
                    </label>
                  ) : null}
                  <button type="submit" disabled={busy}>
                    {busy ? "Opening…" : mode === "join" ? "Join the desk" : "Sign in"}
                  </button>
                  <p className="ara-account__fine">
                    {mode === "join"
                      ? "By joining you keep a seat at the desk. No spam — just the paper."
                      : "New here? "}
                    {mode === "sign-in" ? (
                      <button type="button" className="ara-account__text-btn" onClick={() => switchMode("join")}>
                        Join the edition →
                      </button>
                    ) : null}
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
