import { Container } from "@/components/ui/Container";

export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: React.ReactNode }) {
  return (
    <Container className="max-w-3xl py-16 md:py-24">
      <p className="label text-stone">{eyebrow} · mis à jour {updated}</p>
      <h1 className="display mt-4 text-[clamp(2.2rem,6vw,4.5rem)]">{title}</h1>
      <div className="mt-10 space-y-8 leading-relaxed text-stone [&_h2]:display [&_h2]:text-xl [&_h2]:text-ink [&_p]:mt-3">{children}</div>
    </Container>
  );
}
