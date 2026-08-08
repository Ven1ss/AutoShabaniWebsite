"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginForm() {
  const { t } = useLanguage();
  const { signInWithEmail, isLoggedIn, logout, user } = useAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/katalogu";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await signInWithEmail(email);
    setBusy(false);
    if (result.error) {
      setStatus("error");
      setError(result.error);
      return;
    }
    setStatus("sent");
  }

  if (isLoggedIn && user) {
    return (
      <div className="space-y-4 rounded-card border border-steel-light bg-as-white p-5">
        <p className="text-sm text-as-dark">
          {user.name}
          {user.email ? (
            <span className="block text-as-gray">{user.email}</span>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={next}
            className="inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-medium text-white"
          >
            {t.catalogueBrowseAll}
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex min-h-11 items-center rounded-control border border-steel-light px-5 text-sm"
          >
            {t.productLogout}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-card border border-steel-light bg-as-white p-5"
    >
      <label className="block space-y-1.5">
        <span className="text-caption uppercase tracking-wider text-as-gray">
          {t.productLoginEmail}
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full min-h-12 rounded-lg border border-steel-light px-3 text-base outline-none focus:border-accent"
          placeholder="you@email.com"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accent text-sm font-medium text-white hover:bg-accent-deep disabled:opacity-50"
      >
        {t.productLoginSend}
      </button>
      {status === "sent" ? (
        <p className="text-sm text-accent">{t.productLoginSent}</p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm text-accent">{error}</p>
      ) : null}
    </form>
  );
}
