import { Container } from "@/components/ui/Container";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/catalog/queries";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <section id="produits" className="border-b">
      <Container className="py-20 md:py-28">
        <div className="flex items-end justify-between">
          <h2 className="display text-[clamp(2.2rem,6vw,5rem)]">Les poudres</h2>
          <p className="label text-stone">{products.length} références</p>
        </div>
        <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => <ProductCard key={p.slug} product={p} index={i} />)}
        </div>
      </Container>
    </section>
  );
}
