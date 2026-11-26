import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PurchaseOptions } from "@/components/cart/PurchaseOptions";
import { AddToCart } from "@/components/cart/AddToCart";
import { ProductBanner } from "./ProductBanner";
import { ProductGallery } from "./ProductGallery";
import { FlavourGallery, FlavourIngredients, FlavourProvider, FlavourSku } from "./FlavourContext";
import { Reassurance } from "./Reassurance";
import { FaqPreview } from "./FaqPreview";
import { FocusComplex } from "./FocusComplex";
import { ToggleArrow } from "@/components/ui/ToggleArrow";
import { CLAIMS } from "@/lib/content/methode";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { PRODUCT_INFO } from "@/lib/content/product-info";
import type { FlavourOffer, Product } from "@/lib/catalog/queries";
import type { FlavourId } from "@/lib/content/flavours";
import { pricePerKg } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";

const answer = (q: string) => FAQ_ITEMS.find((i) => i.question === q)?.answer ?? "";

/**
 * La fiche produit : le bandeau, puis la galerie et le bloc d'achat (ancre
 * #commander, cible du bouton du bandeau). `offer` : le produit décliné en goûts (un pot par goût,
 * packs de deux). Le goût choisi commande la galerie, la référence, le bloc
 * d'achat et la liste d'ingrédients. Sans offre par goût, la fiche vend la
 * première variante du catalogue, telle quelle.
 */
export function ProductPage({ product, offer }: { product: Product; offer?: FlavourOffer | null }) {
  const claims = CLAIMS.filter((c) => c.slug === product.slug);
  const info = PRODUCT_INFO[product.slug];
  const hasNrv = Boolean(info?.nutrition.some((n) => n.nrv));
  const skus = Object.fromEntries((offer?.flavours ?? []).map((id) => [id, offer!.singles[id]!.item.sku])) as Partial<Record<FlavourId, string>>;
  return (
    <FlavourProvider flavours={offer?.flavours ?? []}>
      <ProductBanner />
      <Container className="grid gap-10 pb-20 pt-10 md:grid-cols-[1.15fr_1fr] md:gap-16 md:pb-28 md:pt-16">
        {offer ? <FlavourGallery fallback={product.images} /> : <ProductGallery images={product.images} />}
        <div id="commander" className="scroll-mt-28 md:sticky md:top-28 md:self-start">
          <p className="label text-discret">{product.categorySlug === "packs" ? "Pack" : "Poudre"} · <FlavourSku skus={skus} fallback={product.variant.sku} /></p>
          {/* Le nom, et ce que c'est : les deux dans le titre de la page, pour les lecteurs comme pour les moteurs */}
          <h1 className="mt-4">
            <span className="display block text-[clamp(2.6rem,6vw,5rem)]">{product.name}</span>
            {info?.label && <span className="display mt-2 block text-[clamp(1.1rem,2.2vw,1.6rem)] text-doux">{info.label}</span>}
          </h1>
          <p className="mt-6 flex items-baseline gap-3">
            <span className="text-2xl tabular-nums">{formatPrice(product.priceCents)}</span>
            {product.compareAtCents && product.compareAtCents > product.priceCents && (
              <>
                <span className="text-discret line-through tabular-nums">{formatPrice(product.compareAtCents)}</span>
                <span className="label rounded-full bg-rose px-2.5 py-0.5 text-noir">−{Math.round((1 - product.priceCents / product.compareAtCents) * 100)} %</span>
              </>
            )}
          </p>
          {info && product.categorySlug !== "packs" && (
            <p className="mt-2 text-sm text-discret tabular-nums">Soit {formatPrice(Math.round(pricePerKg(product.priceCents, info.netGrams) * 100))} le kilo · {formatPrice(Math.round(product.priceCents / info.servings))} la dose · pot de {info.netGrams} g, {info.servings} doses</p>
          )}
          <p className="mt-6 max-w-md leading-relaxed text-doux">{product.description}</p>
          {info?.caffeineWarning && (
            <p className="mt-6 rounded-chip border border-rose px-4 py-3 text-sm">{info.caffeineWarning}</p>
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
                <summary className="flex cursor-pointer list-none items-center justify-between font-bold [&::-webkit-details-marker]:hidden">Performance<ToggleArrow /></summary>
                <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-doux">
                  {claims.map((c) => (
                    <div key={c.id}>
                      <p className="text-texte">{c.claim}</p>
                      <p className="mt-1">{c.condition}</p>
                    </div>
                  ))}
                  <p className="label normal-case tracking-normal">Source : <a href={claims[0].url} className="underline" rel="noopener" target="_blank">Règlement (UE) n° 432/2012, annexe.</a></p>
                </div>
              </details>
            )}
            {info && (
              <details className="group py-5" open>
                <summary className="flex cursor-pointer list-none items-center justify-between font-bold [&::-webkit-details-marker]:hidden">Composition par dose<ToggleArrow /></summary>
                <div className="mt-4 text-[0.95rem] leading-relaxed text-doux">
                  <p className="text-texte">{info.denomination}</p>
                  <table className="mt-4 w-full text-left tabular-nums">
                    <thead>
                      <tr className="label border-b border-texte text-texte"><th className="py-2 font-normal">{info.serving}</th><th className="py-2 text-right font-normal">Quantité</th>{hasNrv && <th className="py-2 text-right font-normal">% VNR*</th>}</tr>
                    </thead>
                    <tbody>
                      {info.nutrition.map((n) => (
                        <tr key={n.name} className="border-b"><td className="py-2 text-texte">{n.name}</td><td className="py-2 text-right">{n.amount}</td>{hasNrv && <td className="py-2 text-right">{n.nrv ?? "—"}</td>}</tr>
                      ))}
                    </tbody>
                  </table>
                  {info.blend && (
                    <div className="mt-4 overflow-hidden rounded-chip border bg-surface">
                      <p className="label flex items-center justify-between bg-texte px-4 py-2.5 text-fond"><span>{info.blend.name}</span><span className="tabular-nums">{info.blend.amount}</span></p>
                      <ul className="divide-y px-4 tabular-nums">
                        {info.blend.items.map((i) => (
                          <li key={i.name} className="flex justify-between gap-4 py-2"><span className="text-texte">{i.name}</span>{i.amount && <span>{i.amount}</span>}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hasNrv && <p className="mt-2 text-sm">*VNR : valeurs nutritionnelles de référence. — : pas de valeur de référence établie.</p>}
                  {product.slug === "cri" && (
                    <p className="mt-4 text-sm">Chaque ingrédient a sa fiche : <Link href="/ingredients/citrulline" className="underline underline-offset-4 hover:text-rose">citrulline</Link>, <Link href="/ingredients/beta-alanine" className="underline underline-offset-4 hover:text-rose">bêta-alanine</Link>, <Link href="/ingredients/creatine" className="underline underline-offset-4 hover:text-rose">créatine</Link>, <Link href="/ingredients/cafeine" className="underline underline-offset-4 hover:text-rose">caféine</Link>, <Link href="/ingredients/l-theanine" className="underline underline-offset-4 hover:text-rose">L-théanine</Link>. Et le <Link href="/guide/pre-workout" className="underline underline-offset-4 hover:text-rose">guide du pré-workout</Link> explique comment lire l&apos;étiquette.</p>
                  )}
                </div>
              </details>
            )}
            {info && (
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-bold [&::-webkit-details-marker]:hidden">Ingrédients<ToggleArrow /></summary>
                <div className="mt-4 text-[0.95rem] leading-relaxed text-doux">{offer ? <FlavourIngredients /> : <p>{info.ingredients}</p>}</div>
              </details>
            )}
            {info && (
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-bold [&::-webkit-details-marker]:hidden">Conseils d&apos;utilisation et précautions<ToggleArrow /></summary>
                <div className="mt-4 text-[0.95rem] leading-relaxed text-doux"><p>{info.usage}</p><p className="mt-3">{info.warnings}</p></div>
              </details>
            )}
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold [&::-webkit-details-marker]:hidden">Livraison &amp; retours<ToggleArrow /></summary>
              <div className="mt-4 text-[0.95rem] leading-relaxed text-doux"><p>{answer("Quels sont les délais et tarifs de livraison ?")}</p><p className="mt-3">{answer("Puis-je retourner un pot ?")}</p></div>
            </details>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold [&::-webkit-details-marker]:hidden">Fabrication<ToggleArrow /></summary>
              <div className="mt-4 text-[0.95rem] leading-relaxed text-doux"><p>{answer("Où sont fabriqués les produits ?")}</p></div>
            </details>
          </div>
        </div>
      </Container>
      <FaqPreview count={3} />
      {/* Tout en bas de la fiche, juste avant le pied de page */}
      {product.slug === "cri" && <FocusComplex />}
    </FlavourProvider>
  );
}
