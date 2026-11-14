import type { Metadata } from "next";
import localFont from "next/font/local";
import { CartProvider, type BundleRule } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getFlavourOffer, type FlavourOffer } from "@/lib/catalog/queries";
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
    "CRI, le pré-workout SCULT : citrulline 8 g, bêta-alanine 3,2 g, créatine 3 g, 390 mg de caféine par dose. 690 g, 30 doses, trois goûts. Fabriqué dans l'Union européenne, lots numérotés.",
  metadataBase: new URL(siteOrigin()),
  applicationName: "SCULT",
  openGraph: { siteName: "SCULT", type: "website", locale: "fr_FR", title: "SCULT — CRI, le pré-workout.", description: "Rien ne se sculpte en silence. Créatine 3 g, citrulline 8 g, bêta-alanine 3,2 g, 390 mg de caféine par dose. 30 doses, trois goûts." },
  twitter: { card: "summary_large_image", title: "SCULT — CRI, le pré-workout.", description: "Rien ne se sculpte en silence. Créatine 3 g, citrulline 8 g, bêta-alanine 3,2 g, 390 mg de caféine par dose. 30 doses, trois goûts." },
  // Les aperçus Vercel se partagent par lien mais ne doivent pas sortir dans les moteurs de recherche.
  robots: process.env.VERCEL ? { index: false, follow: false } : { index: true, follow: true },
};

/**
 * L'offre de CRI (un pot par goût, packs de deux), lue dans le catalogue. Le
 * panier s'en sert pour regrouper deux pots en pack et pour proposer le 2ᵉ pot.
 */
async function cartOffer(): Promise<FlavourOffer | null> {
  try {
    return await getFlavourOffer("cri");
  } catch {
    return null; // catalogue indisponible : le panier marche sans l'offre pack
  }
}

/** La règle du panier : quels SKU sont des pots à l'unité, quel article est chaque pack. */
function bundleRule(offer: FlavourOffer | null): BundleRule | null {
  if (!offer?.pack) return null;
  const singles = Object.fromEntries(offer.flavours.map((id) => [offer.singles[id]!.item.sku, id]));
  const packs = Object.fromEntries(Object.entries(offer.packs).filter(([, p]) => p.inStock).map(([key, p]) => [key, p.item]));
  const known = Object.fromEntries([...Object.values(offer.singles), ...Object.values(offer.packs)].map((s) => [s!.item.sku, s!.item]));
  return { units: offer.pack.units, singles, packs, known };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const offer = await cartOffer();
  return (
    <html lang="fr" className={`${display.variable} ${inter.variable} ${mono.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationJsonLd()} />
        <CartProvider bundle={bundleRule(offer)}>
          {children}
          <CartDrawer offer={offer} />
        </CartProvider>
      </body>
    </html>
  );
}
