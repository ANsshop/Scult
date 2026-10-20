import { Container } from "@/components/ui/Container";
import { Reveal } from "./Reveal";

const POINTS = [
  ["Nature", "Aucun arôme, aucun édulcorant, aucun colorant. La poudre, c'est tout."],
  ["Lisible", "Le tableau nutritionnel au dos, en noir, en grand. Le numéro de lot sur chaque pot."],
  ["Honnête", "On n'écrit que les allégations autorisées en Europe. Pour le collagène, il n'y en a pas — on le dit."],
  ["Européen", "Façonné dans l'Union européenne chez un fabricant certifié. Pas de poudre importée en vrac."],
];

export function Manifesto() {
  return (
    <section className="border-b">
      <Container className="py-20 md:py-28">
        <Reveal>
          <p className="label text-stone">Le principe</p>
          <h2 className="display mt-6 max-w-5xl text-[clamp(2.2rem,6vw,5.5rem)]">Un corps se sculpte dans le temps. Pas dans une promesse.</h2>
        </Reveal>
        <div className="mt-14 grid gap-px border bg-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.06} className="bg-marble p-6 md:p-8">
              <p className="label text-ruby">0{i + 1}</p>
              <p className="display mt-4 text-2xl">{t}</p>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-stone">{b}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
