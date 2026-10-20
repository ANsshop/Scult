import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog/queries";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const img = product.images[0];
  return (
    <Link href={`/produits/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-klein">
        {img && <Image src={img.url} alt={img.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 [transition-timing-function:var(--ease-scult)] group-hover:scale-[1.03]" />}
        <span className="label absolute left-4 top-4 text-marble">0{index + 1}</span>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <p className="display text-xl">{product.name}</p>
        <p className="tabular-nums">
          {product.compareAtCents && <span className="mr-2 text-stone line-through">{formatPrice(product.compareAtCents)}</span>}
          {formatPrice(product.priceCents)}
        </p>
      </div>
      <p className="mt-1 text-sm text-stone">{product.variant.name}{product.variant.unitCount > 1 ? ` · ${product.variant.unitCount} pots` : ""}</p>
    </Link>
  );
}
