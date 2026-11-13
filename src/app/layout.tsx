import type { Metadata } from "next";
import localFont from "next/font/local";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer, type CartUpsell } from "@/components/cart/CartDrawer";
import { getBundleFor, getProductBySlug } from "@/lib/catalog/queries";
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
  openGraph: { siteName: "SCULT", type: "website", locale: "fr_FR", title: "SCULT — CRI, le pré-workout.", description: "Rien ne se sculpte en silence. Créatine 3 g, citrulline 8 g, bêta-alanine 4 g, caféine 150 mg par dose. 30 doses, fruits rouges." },
  twitter: { card: "summary_large_image", title: "SCULT — CRI, le pré-workout.", description: "Rien ne se sculpte en silence. Créatine 3 g, citrulline 8 g, bêta-alanine 4 g, caféine 150 mg par dose. 30 doses, fruits rouges." },
  // Les aperçus Vercel se partagent par lien mais ne doivent pas sortir dans les moteurs de recherche.
  robots: process.env.VERCEL ? { index: false, follow: false } : { index: true, follow: true },
};

/** Le pack proposé dans le panier quand il contient CRI à l'unité. Prix lus dans le catalogue. */
async function cartUpsell(): Promise<CartUpsell | null> {
  try {
    const [single, bundle] = await Promise.all([getProductBySlug("cri"), getBundleFor("cri")]);
    if (!single || !bundle || !bundle.inStock) return null;
    return {
      fromSku: single.variant.sku,
      unitPriceCents: single.priceCents,
      units: bundle.variant.unitCount,
      item: { sku: bundle.variant.sku, slug: single.slug, name: bundle.name, priceCents: bundle.priceCents, image: bundle.images[0]?.url ?? null },
    };
  } catch {
    return null; // catalogue indisponible : le panier marche sans la proposition
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const upsell = await cartUpsell();
  return (
    <html lang="fr" className={`${display.variable} ${inter.variable} ${mono.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationJsonLd()} />
        <CartProvider bundle={upsell ? { fromSku: upsell.fromSku, units: upsell.units, item: upsell.item } : null}>
          {children}
          <CartDrawer upsell={upsell} />
        </CartProvider>
      </body>
    </html>
  );
}
