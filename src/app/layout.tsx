import type { Metadata } from "next";
import localFont from "next/font/local";
import { CartProvider, type BundleRule } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getFlavourOffer, type FlavourOffer } from "@/lib/catalog/queries";
import { Suivi } from "@/components/site/Suivi";
import { INDEXNOW_KEY, indexable, siteOrigin } from "@/lib/seo";
import { INTRO_HEAD_SCRIPT } from "@/components/site/intro/script";
import "./globals.css";

// Polices auto-hébergées (fichiers Fontsource, licence OFL) : aucun appel à
// Google Fonts, ni au build ni à l'exécution. Les trois polices de l'ancien
// site, gardées telles quelles : Archivo Black (titres), Inter (texte),
// JetBrains Mono (étiquettes). Les deux polices du faux site rose (Pacifico,
// Quicksand) sont dans public/fonts/ et ne se chargent que si l'intro joue.
const display = localFont({ src: "../fonts/archivo-black-latin-400-normal.woff2", variable: "--police-titre", weight: "400", display: "swap" });
// Le titre du hero de l'accueil : Barlow Condensed extra-gras italique (Fontsource, licence OFL), choisi sur planche le 2026-11-26.
const affiche = localFont({ src: "../fonts/barlow-condensed-latin-800-italic.woff2", variable: "--police-affiche", weight: "800", style: "italic", display: "swap" });
const inter = localFont({ src: "../fonts/inter-latin-wght-normal.woff2", variable: "--police", weight: "100 900", display: "swap" });
const mono = localFont({ src: "../fonts/jetbrains-mono-latin-wght-normal.woff2", variable: "--police-mono", weight: "100 800", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SCULT — CRI, le pré-workout aux dosages écrits sur le pot", template: "%s — SCULT" },
  description:
    "CRI, le pré-workout SCULT : citrulline 8 g, bêta-alanine 3,2 g, créatine 3 g, 390 mg de caféine par dose. 690 g, 30 doses, goût fraise piquante. Fabriqué dans l'Union européenne, lots numérotés.",
  metadataBase: new URL(siteOrigin()),
  applicationName: "SCULT",
  openGraph: { siteName: "SCULT", type: "website", locale: "fr_FR", title: "SCULT — CRI, le pré-workout.", description: "Rien ne se sculpte en silence. Créatine 3 g, citrulline 8 g, bêta-alanine 3,2 g, 390 mg de caféine par dose. 30 doses, goût fraise piquante." },
  twitter: { card: "summary_large_image", title: "SCULT — CRI, le pré-workout.", description: "Rien ne se sculpte en silence. Créatine 3 g, citrulline 8 g, bêta-alanine 3,2 g, 390 mg de caféine par dose. 30 doses, goût fraise piquante." },
  // Une adresse de démonstration se partage par lien mais ne sort pas dans les moteurs. En production : indexable,
  // avec le droit d'afficher de grandes images et des extraits entiers (c'est aussi ce que lisent les moteurs de réponse).
  robots: indexable() ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } } : { index: false, follow: false },
  // Les jetons de propriété de Google Search Console et de Bing Webmaster Tools, quand ils sont renseignés.
  // La clé IndexNow, lue par scripts/indexnow.mjs (le fichier public/<clé>.txt la confirme aux moteurs).
  other: { "indexnow-key": INDEXNOW_KEY },
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } } : {}),
  },
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
  return { units: offer.pack.units, fullCents: offer.pack.fullPriceCents, singles, packs, known };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const offer = await cartOffer();
  return (
    // `data-intro` est posé sur <html> par le script du <head>, avant l'hydratation : d'où suppressHydrationWarning.
    <html lang="fr" className={`${display.variable} ${affiche.variable} ${inter.variable} ${mono.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Avant le premier affichage : l'intro rose joue-t-elle ? (voir components/site/intro/script.ts) */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_HEAD_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <CartProvider bundle={bundleRule(offer)}>
          {children}
          <CartDrawer offer={offer} />
        </CartProvider>
        {/* Mesure d'audience sans cookie, pour le taux de conversion de l'admin */}
        <Suivi />
      </body>
    </html>
  );
}
