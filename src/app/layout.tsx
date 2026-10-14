import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import Analytics from "@/components/Analytics";
import Providers from "@/components/Providers";
import { getServerLocale } from "@/lib/locale";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

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
    default: "AUTO SHABANI | Pjesë këmbimi për vetura — Prishtinë",
    template: "%s | AUTO SHABANI",
  },
  description:
    "Pjesë këmbimi për vetura në Prishtinë. Zgjedhje e gjerë për marka të ndryshme — për servise dhe klientë individualë. AUTO SHABANI.",
  keywords: [
    "pjesë këmbimi",
    "vetura",
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
    title: "AUTO SHABANI | Pjesë këmbimi për vetura — Prishtinë",
    description:
      "Pjesë këmbimi për vetura në Prishtinë. Për servise dhe klientë individualë.",
    type: "website",
    locale: "sq_AL",
    url: siteUrl,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "AUTO SHABANI" }],
  },
  twitter: {
    card: "summary",
    title: "AUTO SHABANI | Pjesë këmbimi për vetura — Prishtinë",
    description:
      "Pjesë këmbimi për vetura në Prishtinë — AUTO SHABANI.",
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
      className={`${manrope.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
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
