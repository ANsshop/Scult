import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { FaqList } from "./FaqList";

export function FaqPreview({ count = 4 }: { count?: number }) {
  return (
    <section className="border-b">
      <Container className="grid gap-10 py-20 md:grid-cols-[1fr_2fr] md:py-28">
        <div>
          <p className="label text-discret">Questions</p>
          <h2 className="display mt-4 text-[clamp(2rem,5vw,4rem)]">Ce qu&apos;on nous demande.</h2>
          <Link href="/faq" className="label mt-6 inline-block underline decoration-rose decoration-2 underline-offset-[6px] hover:text-rose">Toutes les questions</Link>
        </div>
        <FaqList items={FAQ_ITEMS.slice(0, count)} group="faq-apercu" />
      </Container>
    </section>
  );
}
