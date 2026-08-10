"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { trackEvent } from "@/lib/analytics";

export default function CallbackRequestForm({
  tone = "light",
}: {
  tone?: "light" | "dark";
}) {
  const { t, locale } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [busy, setBusy] = useState(false);

  const dark = tone === "dark";
  const inputCls = dark
    ? "w-full min-h-12 rounded-lg border border-white/20 bg-white/5 px-3 text-base text-white placeholder:text-white/40 outline-none focus:border-white/50"
    : "w-full min-h-12 rounded-lg border border-steel-light bg-as-white px-3 text-base text-as-dark placeholder:text-as-gray outline-none focus:border-as-dark/30";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, note, locale }),
      });
      if (!res.ok) throw new Error("failed");
      trackEvent("callback_request", { locale });
      setStatus("ok");
      setName("");
      setPhone("");
      setNote("");
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p
        className={`text-sm font-medium ${dark ? "text-white" : "text-as-dark"}`}
      >
        {t.callbackTitle}
      </p>
      <p className={`text-sm ${dark ? "text-white/65" : "text-as-secondary"}`}>
        {t.callbackHint}
      </p>
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t.callbackName}
        className={inputCls}
        autoComplete="name"
      />
      <input
        required
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t.callbackPhone}
        className={inputCls}
        autoComplete="tel"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.callbackNote}
        className={inputCls}
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-50"
      >
        {t.callbackSubmit}
      </button>
      {status === "ok" ? (
        <p className={`text-sm ${dark ? "text-white" : "text-accent"}`}>
          {t.callbackThanks}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm text-accent">{t.callbackError}</p>
      ) : null}
    </form>
  );
}
