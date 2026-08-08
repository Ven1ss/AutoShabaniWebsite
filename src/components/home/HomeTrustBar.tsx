"use client";

import { useLanguage } from "@/context/LanguageContext";
import { CONTACT, whatsappEnquireUrl } from "@/lib/contact";
import { trackEvent } from "@/lib/analytics";

export default function HomeTrustBar() {
  const { t, locale } = useLanguage();
  const wa = whatsappEnquireUrl(
    locale === "sq"
      ? "Përshëndetje AUTO SHABANI, dua të pyes për pjesë."
      : "Hello AUTO SHABANI, I would like to ask about parts."
  );

  return (
    <section className="border-y border-steel-light bg-as-white">
      <div className="container-as py-4 sm:py-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-sm">
        <p className="text-as-secondary">
          <span className="font-medium text-as-dark">{t.trustLocations}</span>
          <span className="text-as-mist"> · </span>
          {t.contactHoursValue}
        </p>
        <p className="text-as-secondary sm:text-center">{t.trustResponse}</p>
        <p className="sm:text-right">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("whatsapp_click", { place: "home_trust" })}
            className="font-medium text-accent hover:text-accent-deep"
          >
            WhatsApp {CONTACT.phoneDisplay[1]} →
          </a>
        </p>
      </div>
    </section>
  );
}
