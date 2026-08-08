import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import CartDrawer from "@/components/CartDrawer";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1D1D1F",
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
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-as-snow text-as-dark min-h-screen">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <CartDrawer />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
