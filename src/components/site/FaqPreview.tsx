import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FAQ_ITEMS } from "@/lib/content/faq";

export function FaqPreview({ count = 4 }: { count?: number }) {
  return (
    <section className="border-b">
      <Container className="grid gap-10 py-20 md:grid-cols-[1fr_2fr] md:py-28">
        <div>
          <p className="label text-stone">Questions</p>
          <h2 className="display mt-4 text-[clamp(2rem,5vw,4rem)]">Ce qu&apos;on nous demande.</h2>
          <Link href="/faq" className="label mt-6 inline-block underline underline-offset-4">Toutes les questions</Link>
        </div>
        <dl className="divide-y border-y">
          {FAQ_ITEMS.slice(0, count).map((i) => (
            <div key={i.question} className="py-5">
              <dt className="font-medium">{i.question}</dt>
              <dd className="mt-2 text-[0.95rem] leading-relaxed text-stone">{i.answer}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
