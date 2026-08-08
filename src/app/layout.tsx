import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Analytics from "@/components/Analytics";
import Providers from "@/components/Providers";
import { getServerLocale } from "@/lib/locale";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://autoshabani.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1D1D1F",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AUTO SHABANI | Pjesë këmbimi — Prishtinë",
    template: "%s | AUTO SHABANI",
  },
  description:
    "Saktësi. Performancë. Perfeksion. Pjesë këmbimi origjinale në Prishtinë — AUTO SHABANI. Dërgo listën në WhatsApp.",
  keywords: [
    "pjesë këmbimi",
    "auto parts Kosovo",
    "Prishtina",
    "OEM",
    "SKU",
    "AUTO SHABANI",
  ],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "AUTO SHABANI | Pjesë këmbimi — Prishtinë",
    description:
      "Pjesë këmbimi origjinale në Prishtinë. Shiko katalogun dhe dërgo listën në WhatsApp.",
    type: "website",
    locale: "sq_AL",
    url: siteUrl,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "AUTO SHABANI" }],
  },
  twitter: {
    card: "summary",
    title: "AUTO SHABANI | Pjesë këmbimi — Prishtinë",
    description:
      "Pjesë këmbimi origjinale në Prishtinë. Shiko katalogun — AUTO SHABANI.",
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
};

const supabaseOrigin = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
})();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preconnect"
          href="https://fonts.cdnfonts.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.cdnfonts.com/css/ethnocentric"
        />
        {supabaseOrigin ? (
          <>
            <link
              rel="preconnect"
              href={supabaseOrigin}
              crossOrigin="anonymous"
            />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        ) : null}
      </head>
      <body className="font-sans antialiased bg-as-snow text-as-dark min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Providers initialLocale={locale}>
          <div id="main-content">{children}</div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
