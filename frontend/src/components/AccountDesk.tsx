"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { MemberAuth } from "@/components/MemberAuth";
import { useWantList } from "@/lib/wantlist";

const TOPICS = ["Order or delivery", "Account", "A digest", "Something else"];

/** The support form. Signed in it is prefilled; signed out it asks who you are,
 *  so anyone can write in without making an account first. */
function SupportForm({ member }: { member: { name: string; email: string } | null }) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [who, setWho] = useState({ name: "", email: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const name = member ? member.name : who.name;
  const email = member ? member.email : who.email;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send your message.");
      setMessage("");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("idle");
    }
  }

  return (
    <form className="ck__field" onSubmit={onSubmit}>
      <legend>Message us</legend>
      <p className="ck__note">
        {member
          ? `We answer at ${email}. Most replies go out within one business day.`
          : "Tell us how to reach you. Most replies go out within one business day."}
      </p>
      {!member ? (
        <div className="ck__field-row">
          <input
            className="ck__input"
            required
            name="name"
            placeholder="Your name"
            autoComplete="name"
            value={who.name}
            onChange={(e) => setWho((w) => ({ ...w, name: e.target.value }))}
          />
          <input
            className="ck__input"
            required
            type="email"
            name="email"
            placeholder="Your email"
            autoComplete="email"
            value={who.email}
            onChange={(e) => setWho((w) => ({ ...w, email: e.target.value }))}
          />
        </div>
      ) : null}
      <select className="ck__input" value={topic} onChange={(e) => setTopic(e.target.value)}>
        {TOPICS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <textarea
        className="ck__input ck__textarea"
        required
        minLength={5}
        rows={6}
        placeholder="What can we help with?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error ? <p className="md__err">{error}</p> : null}
      {state === "sent" ? (
        <p className="md__sent" role="status">Message sent. We&rsquo;ll reply to {email}.</p>
      ) : null}
      <button type="submit" className="ck__btn ck__btn--gold" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

export function AccountDesk() {
  const { member, ready, logout } = useAuth();
  const want = useWantList();

  return (
    <main className="ck md">
      <span className="ck__trim" aria-hidden="true" />
      <div className="ck__inner">
        <span className="ck__kicker">Member</span>
        <h1 className="ck__title">Account</h1>

        {!ready ? (
          <p className="md__loading">Loading your account…</p>
        ) : !member ? (
          <div className="ck__grid">
            <div className="ck__form">
              <SupportForm member={null} />
            </div>
            <aside className="md__signin">
              <MemberAuth note="Sign in to see your account details and orders." />
            </aside>
          </div>
        ) : (
          <div className="ck__grid">
            <div className="ck__form">
              <fieldset className="ck__field">
                <legend>Your details</legend>
                <div className="ck__row"><span>Name</span><strong>{member.name}</strong></div>
                <div className="ck__row"><span>Email</span><strong>{member.email}</strong></div>
                <div className="ck__row"><span>Member number</span><strong>{member.memberNo}</strong></div>
                <div className="ck__row">
                  <span>Member since</span>
                  <strong>
                    {new Date(member.createdAt).toLocaleDateString(undefined, {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </strong>
                </div>
              </fieldset>

              <SupportForm member={member} />
            </div>

            <aside className="ck__summary">
              <div className="ck__row"><span>Bookshelf</span><strong>{want.items.length}</strong></div>
              <div className="ck__row"><span>Orders</span><strong>0</strong></div>
              <Link className="ck__btn ck__btn--ghost" href="/companies">Browse digests</Link>
              <Link className="ck__btn ck__btn--ghost" href="/cart">View cart</Link>
              <button type="button" className="ck__btn ck__btn--ghost" onClick={() => logout()}>
                Sign out
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
