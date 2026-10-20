"use client";

import { useCart } from "./CartProvider";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/lib/catalog/queries";
import { formatPrice } from "@/lib/utils";

export function AddToCart({ product, className }: { product: Product; className?: string }) {
  const { add } = useCart();
  if (!product.inStock) return <Button disabled className={className}>Rupture</Button>;
  return (
    <Button
      className={className}
      onClick={() => add({ sku: product.variant.sku, slug: product.slug, name: product.name, priceCents: product.priceCents, image: product.images[0]?.url ?? null })}
    >
      {product.preorderEta ? `Précommander · ${product.preorderEta}` : `Ajouter · ${formatPrice(product.priceCents)}`}
    </Button>
  );
}
