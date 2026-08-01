import type { Metadata } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
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

export const metadata: Metadata = {
  title: "AUTO SHABANI | Premium Car Spare Parts — Prishtina, Kosovo",
  description:
    "AUTO SHABANI — Precision. Performance. Perfection. Kosovo's leading premium car spare parts provider. Genuine & OEM parts, expert knowledge, trusted by professionals in Prishtina.",
  keywords: [
    "car spare parts",
    "auto parts Kosovo",
    "Prishtina",
    "OEM parts",
    "genuine parts",
    "AUTO SHABANI",
  ],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "AUTO SHABANI | Premium Car Spare Parts — Prishtina",
    description:
      "Precision. Performance. Perfection. Premium car spare parts in Kosovo.",
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
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-surface text-ink min-h-screen">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
