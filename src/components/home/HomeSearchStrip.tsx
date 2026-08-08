"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CatalogueSearchTicket from "@/components/CatalogueSearchTicket";
import { useLanguage } from "@/context/LanguageContext";

/** Homepage search — jumps straight into /katalogu with the query. */
export default function HomeSearchStrip() {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function go(value: string) {
    const q = value.trim();
    router.push(q ? `/katalogu?q=${encodeURIComponent(q)}` : "/katalogu");
  }

  return (
    <section className="relative z-20 -mt-5 sm:-mt-6">
      <div className="container-as">
        <div className="rounded-xl border border-steel-light/80 bg-as-white/95 p-3 sm:p-4 shadow-card backdrop-blur-md">
          <p className="mb-2.5 text-sm text-as-secondary px-0.5">
            {t.catalogueSubtitle}
          </p>
          <CatalogueSearchTicket
            value={query}
            onChange={setQuery}
            onSubmit={go}
            size="bar"
            autoFocus={false}
          />
        </div>
      </div>
    </section>
  );
}
