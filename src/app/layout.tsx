import type { Metadata } from "next";
import localFont from "next/font/local";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { JsonLd } from "@/components/site/JsonLd";
import { organizationJsonLd, siteOrigin } from "@/lib/seo";
import "./globals.css";

// Polices auto-hébergées (fichiers Fontsource, licence OFL) : le build ne
// dépend d'aucun appel réseau, ce qui vaut sur le VPS comme en CI.
const display = localFont({ src: "../fonts/archivo-black-latin-400-normal.woff2", variable: "--font-display", weight: "400", display: "swap" });
const inter = localFont({ src: "../fonts/inter-latin-wght-normal.woff2", variable: "--font-inter", weight: "100 900", display: "swap" });
const mono = localFont({ src: "../fonts/jetbrains-mono-latin-wght-normal.woff2", variable: "--font-mono", weight: "100 800", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SCULT — CRI, le pré-workout aux dosages écrits sur le pot", template: "%s — SCULT" },
  description:
    "CRI, le pré-workout SCULT : citrulline 8 g, bêta-alanine 4 g, créatine 3 g, caféine 150 mg par dose. 690 g, 30 doses, fruits rouges. Fabriqué dans l'Union européenne, lots numérotés.",
  metadataBase: new URL(siteOrigin()),
  applicationName: "SCULT",
  openGraph: { siteName: "SCULT", type: "website", locale: "fr_FR", title: "SCULT — CRI, le pré-workout.", description: "Citrulline 8 g, bêta-alanine 4 g, créatine 3 g, caféine 150 mg par dose. 30 doses, fruits rouges. Fabriqué en UE." },
  twitter: { card: "summary_large_image", title: "SCULT — CRI, le pré-workout.", description: "Citrulline 8 g, bêta-alanine 4 g, créatine 3 g, caféine 150 mg par dose. 30 doses." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${display.variable} ${inter.variable} ${mono.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationJsonLd()} />
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
