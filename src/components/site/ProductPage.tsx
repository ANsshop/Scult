import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AddToCart } from "@/components/cart/AddToCart";
import { ProductGallery } from "./ProductGallery";
import { Reassurance } from "./Reassurance";
import { FaqPreview } from "./FaqPreview";
import { CLAIMS } from "@/lib/content/methode";
import { FAQ_ITEMS } from "@/lib/content/faq";
import type { Product } from "@/lib/catalog/queries";
import { formatPrice } from "@/lib/utils";

const answer = (q: string) => FAQ_ITEMS.find((i) => i.question === q)?.answer ?? "";

export function ProductPage({ product, upsell }: { product: Product; upsell?: Product | null }) {
  const claim = CLAIMS.find((c) => c.slug === product.slug);
  return (
    <>
      <Container className="grid gap-10 pb-20 pt-8 md:grid-cols-[1.15fr_1fr] md:gap-16 md:pb-28">
        <ProductGallery images={product.images} />
        <div className="md:sticky md:top-24 md:self-start">
          <p className="label text-stone">{product.categorySlug === "packs" ? "Pack" : "Poudre"} · {product.variant.sku}</p>
          <h1 className="display mt-4 text-[clamp(2.6rem,6vw,5rem)]">{product.name}</h1>
          <p className="mt-6 flex items-baseline gap-3">
            <span className="text-2xl tabular-nums">{formatPrice(product.priceCents)}</span>
            {product.compareAtCents && product.compareAtCents > product.priceCents && (
              <>
                <span className="text-stone line-through tabular-nums">{formatPrice(product.compareAtCents)}</span>
                <span className="label bg-ruby px-2 py-0.5 text-white">−{Math.round((1 - product.priceCents / product.compareAtCents) * 100)} %</span>
              </>
            )}
          </p>
          <p className="mt-6 max-w-md leading-relaxed text-stone">{product.description}</p>
          <AddToCart product={product} className="mt-8 w-full" />
          {upsell && (
            <Link href={`/produits/${upsell.slug}`} className="group mt-5 flex items-center justify-between border p-4 transition-colors hover:border-klein">
              <span>
                <span className="block font-medium">{upsell.name}</span>
                <span className="mt-0.5 block text-sm text-stone">{formatPrice(upsell.priceCents)}{upsell.compareAtCents ? ` au lieu de ${formatPrice(upsell.compareAtCents)}` : ""} · livraison offerte</span>
              </span>
              <span aria-hidden className="text-klein transition-transform group-hover:translate-x-1">→</span>
            </Link>
          )}
          <Reassurance className="mt-8" />
          <div className="mt-10 divide-y border-y">
            {claim && (
              <details className="group py-5" open>
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">Ce que l&apos;Europe autorise à dire<span className="text-klein group-open:rotate-45 transition-transform">+</span></summary>
                <div className="mt-4 text-[0.95rem] leading-relaxed text-stone">
                  <p className="text-ink">« {claim.claim} »</p>
                  <p className="mt-2">{claim.condition}</p>
                  <p className="mt-2 label normal-case tracking-normal">Source : <a href={claim.url} className="underline" rel="noopener" target="_blank">{claim.source}</a></p>
                </div>
              </details>
            )}
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">Livraison &amp; retours<span className="text-klein group-open:rotate-45 transition-transform">+</span></summary>
              <div className="mt-4 text-[0.95rem] leading-relaxed text-stone"><p>{answer("Quels sont les délais et tarifs de livraison ?")}</p><p className="mt-3">{answer("Puis-je retourner un pot ?")}</p></div>
            </details>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">Fabrication<span className="text-klein group-open:rotate-45 transition-transform">+</span></summary>
              <div className="mt-4 text-[0.95rem] leading-relaxed text-stone"><p>{answer("Où sont fabriqués les produits ?")}</p></div>
            </details>
          </div>
        </div>
      </Container>
      <FaqPreview count={3} />
    </>
  );
}
