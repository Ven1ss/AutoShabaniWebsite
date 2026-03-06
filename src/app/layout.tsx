import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-satoshi",
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
  openGraph: {
    title: "AUTO SHABANI | Premium Car Spare Parts — Prishtina",
    description:
      "Precision. Performance. Perfection. Premium car spare parts in Kosovo.",
    type: "website",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sq" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-black-deep text-white min-h-screen">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
