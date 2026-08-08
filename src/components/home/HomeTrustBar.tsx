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
    <section className="border-b border-steel-light bg-as-snow">
      <div className="container-as py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6 text-sm text-as-secondary">
        <p>
          <span className="text-as-dark font-medium">{t.trustLocations}</span>
          {" · "}
          {t.contactHoursValue}
        </p>
        <p className="sm:text-center">{t.trustResponse}</p>
        <p className="sm:text-right">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("whatsapp_click", { place: "home_trust" })
            }
            className="font-medium text-as-dark underline underline-offset-2 decoration-as-mist hover:text-accent hover:decoration-accent transition-colors"
          >
            WhatsApp {CONTACT.phoneDisplay[1]}
          </a>
        </p>
      </div>
    </section>
  );
}
