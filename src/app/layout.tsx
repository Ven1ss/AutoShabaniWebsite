import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, JetBrains_Mono, Manrope } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#161A20",
};

export const metadata: Metadata = {
  title: "AUTO SHABANI | Pjesë këmbimi — Prishtinë",
  description:
    "Saktësi. Performancë. Perfeksion. Pjesë këmbimi origjinale në Prishtinë — AUTO SHABANI.",
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
      "Pjesë këmbimi origjinale në Prishtinë. Shiko katalogun — AUTO SHABANI.",
    type: "website",
    images: ["/logo.png"],
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sq"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-surface text-ink min-h-screen">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
