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
  title: { default: "SCULT — Whey, créatine, collagène. Nature, fabriqués en UE.", template: "%s — SCULT" },
  description:
    "Trois poudres nature fabriquées dans l'Union européenne : whey isolate 90 %, créatine Creapure®, collagène marin. Sans édulcorant, lots numérotés. Trio à 79 €, livraison offerte.",
  metadataBase: new URL(siteOrigin()),
  applicationName: "SCULT",
  openGraph: { siteName: "SCULT", type: "website", locale: "fr_FR", title: "SCULT — Whey, créatine, collagène. Nature, fabriqués en UE.", description: "Trois poudres nature, fabriquées en UE, lots numérotés. Trio à 79 €, livraison offerte." },
  twitter: { card: "summary_large_image", title: "SCULT — Whey, créatine, collagène.", description: "Trois poudres nature, fabriquées en UE. Trio à 79 €, livraison offerte." },
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
