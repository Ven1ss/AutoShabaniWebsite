import { CONTACT } from "@/lib/contact";
import { SITE_URL } from "@/lib/seo";

/** Local shop entity — no street address is stored, so none is invented. */
export default function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    name: "AUTO SHABANI",
    url: SITE_URL,
    image: `${SITE_URL}/logo.png`,
    email: CONTACT.email,
    telephone: [...CONTACT.phoneTel],
    areaServed: [
      { "@type": "City", name: "Prishtina" },
      { "@type": "Country", name: "Kosovo" },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Prishtinë",
      addressCountry: "XK",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
