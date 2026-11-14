import { Container } from "@/components/ui/Container";
import { PurchaseOptions } from "@/components/cart/PurchaseOptions";
import { AddToCart } from "@/components/cart/AddToCart";
import { ProductGallery } from "./ProductGallery";
import { FlavourGallery, FlavourIngredients, FlavourProvider, FlavourSku } from "./FlavourContext";
import { Reassurance } from "./Reassurance";
import { FaqPreview } from "./FaqPreview";
import { ToggleArrow } from "@/components/ui/ToggleArrow";
import { CLAIMS } from "@/lib/content/methode";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { PRODUCT_INFO } from "@/lib/content/product-info";
import type { FlavourOffer, Product } from "@/lib/catalog/queries";
import type { FlavourId } from "@/lib/content/flavours";
import { formatPrice } from "@/lib/utils";

const answer = (q: string) => FAQ_ITEMS.find((i) => i.question === q)?.answer ?? "";

/**
 * La fiche produit. `offer` : le produit décliné en goûts (un pot par goût,
 * packs de deux). Le goût choisi commande la galerie, la référence, le bloc
 * d'achat et la liste d'ingrédients. Sans offre par goût, la fiche vend la
 * première variante du catalogue, telle quelle.
 */
export function ProductPage({ product, offer }: { product: Product; offer?: FlavourOffer | null }) {
  const claims = CLAIMS.filter((c) => c.slug === product.slug);
  const info = PRODUCT_INFO[product.slug];
  const skus = Object.fromEntries((offer?.flavours ?? []).map((id) => [id, offer!.singles[id]!.item.sku])) as Partial<Record<FlavourId, string>>;
  return (
    <FlavourProvider flavours={offer?.flavours ?? []}>
      <Container className="grid gap-10 pb-20 pt-8 md:grid-cols-[1.15fr_1fr] md:gap-16 md:pb-28">
        {offer ? <FlavourGallery fallback={product.images} /> : <ProductGallery images={product.images} />}
        <div className="md:sticky md:top-24 md:self-start">
          <p className="label text-stone">{product.categorySlug === "packs" ? "Pack" : "Poudre"} · <FlavourSku skus={skus} fallback={product.variant.sku} /></p>
          <h1 className="display mt-4 text-[clamp(2.6rem,6vw,5rem)]">{product.name}</h1>
          <p className="mt-6 flex items-baseline gap-3">
            <span className="text-2xl tabular-nums">{formatPrice(product.priceCents)}</span>
            {product.compareAtCents && product.compareAtCents > product.priceCents && (
              <>
                <span className="text-stone line-through tabular-nums">{formatPrice(product.compareAtCents)}</span>
                <span className="label rounded-full bg-ruby px-2.5 py-0.5 text-white">−{Math.round((1 - product.priceCents / product.compareAtCents) * 100)} %</span>
              </>
            )}
          </p>
          <p className="mt-6 max-w-md leading-relaxed text-stone">{product.description}</p>
          {info?.caffeineWarning && (
            <p className="mt-6 rounded-chip border border-ink px-4 py-3 text-sm font-medium">{info.caffeineWarning}</p>
          )}
          {offer ? (
            <PurchaseOptions offer={offer} />
          ) : (
            <AddToCart
              item={{ sku: product.variant.sku, slug: product.slug, name: product.name, priceCents: product.priceCents, image: product.images[0]?.url ?? null }}
              inStock={product.inStock}
              preorderEta={product.preorderEta}
              className="mt-8 w-full"
            />
          )}
          <Reassurance className="mt-8" />
          <div className="mt-10 divide-y border-y">
            {claims.length > 0 && (
              <details className="group py-5" open>
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">Performance<ToggleArrow /></summary>
                <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-stone">
                  {claims.map((c) => (
                    <div key={c.id}>
                      <p className="text-ink">{c.claim}</p>
                      <p className="mt-1">{c.condition}</p>
                    </div>
                  ))}
                  <p className="label normal-case tracking-normal">Source : <a href={claims[0].url} className="underline" rel="noopener" target="_blank">Règlement (UE) n° 432/2012, annexe.</a></p>
                </div>
              </details>
            )}
            {info && (
              <details className="group py-5" open>
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">Composition par dose<ToggleArrow /></summary>
                <div className="mt-4 text-[0.95rem] leading-relaxed text-stone">
                  <p className="text-ink">{info.denomination}</p>
                  <table className="mt-4 w-full text-left tabular-nums">
                    <thead>
                      <tr className="label border-b border-ink text-ink"><th className="py-2 font-normal">{info.serving}</th><th className="py-2 text-right font-normal">Quantité</th><th className="py-2 text-right font-normal">% VNR*</th></tr>
                    </thead>
                    <tbody>
                      {info.nutrition.map((n) => (
                        <tr key={n.name} className="border-b"><td className="py-2 text-ink">{n.name}</td><td className="py-2 text-right">{n.amount}</td><td className="py-2 text-right">{n.nrv ?? "—"}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-sm">*VNR : valeurs nutritionnelles de référence. — : pas de valeur de référence établie.</p>
                </div>
              </details>
            )}
            {info && (
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">Ingrédients<ToggleArrow /></summary>
                <div className="mt-4 text-[0.95rem] leading-relaxed text-stone">{offer ? <FlavourIngredients /> : <p>{info.ingredients}</p>}</div>
              </details>
            )}
            {info && (
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">Conseils d&apos;utilisation et précautions<ToggleArrow /></summary>
                <div className="mt-4 text-[0.95rem] leading-relaxed text-stone"><p>{info.usage}</p><p className="mt-3">{info.warnings}</p></div>
              </details>
            )}
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">Livraison &amp; retours<ToggleArrow /></summary>
              <div className="mt-4 text-[0.95rem] leading-relaxed text-stone"><p>{answer("Quels sont les délais et tarifs de livraison ?")}</p><p className="mt-3">{answer("Puis-je retourner un pot ?")}</p></div>
            </details>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">Fabrication<ToggleArrow /></summary>
              <div className="mt-4 text-[0.95rem] leading-relaxed text-stone"><p>{answer("Où sont fabriqués les produits ?")}</p></div>
            </details>
          </div>
        </div>
      </Container>
      <FaqPreview count={3} />
    </FlavourProvider>
  );
}
