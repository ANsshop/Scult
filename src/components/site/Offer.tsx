import type { Product } from "@/lib/catalog/queries";
import { CRI_DOSES, getFormula } from "@/lib/content/formula";
import { OfferScroll } from "./OfferScroll";

/**
 * Section 2 de l'accueil. Prépare les données (côté serveur) et les passe à
 * la scène de défilement : le pot 3D au centre, les dosages, l'achat.
 */
export function Offer({ product }: { product: Product }) {
  const formula = getFormula(product.slug);
  if (!formula) return null;
  return <OfferScroll product={product} lines={formula.main} doses={CRI_DOSES} caffeineWarning={formula.caffeineWarning} />;
}
