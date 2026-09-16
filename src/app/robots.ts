import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/katalogu", "/katalogu/"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/auth",
          "/auth/",
          "/porosia",
          "/porosia/",
          "/design-system",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
