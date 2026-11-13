import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CLAIMS } from "@/lib/content/methode";

/**
 * Section « Performance » de l'accueil : ce que CRI a le droit de promettre
 * à l'entraînement. Quatre thèmes — capacités physiques, muscle, énergie,
 * fatigue — chacun porté par une allégation autorisée, citée mot pour mot
 * avec l'ingrédient et sa dose (lib/content/methode.ts). Rien d'autre n'est
 * affirmé : c'est la seule façon de parler de performance pour un complément
 * alimentaire en Europe.
 */
export function Performance() {
  const claims = CLAIMS.filter((c) => c.theme && c.claim);
  return (
    <section id="performance" className="scroll-mt-14 border-b">
      <Container className="py-6 md:py-10">
        <div className="relative overflow-hidden rounded-card bg-ink text-marble">
          <div className="grid md:grid-cols-[1.25fr_1fr]">
            <div className="p-6 md:p-12">
              <p className="label text-marble/70">Performance</p>
              <h2 className="display mt-4 text-[clamp(2.2rem,5vw,4.75rem)]">Pour les séries qui comptent.</h2>
              <ol className="mt-8 md:mt-12">
                {claims.map((c, i) => (
                  <li key={c.id} className="grid grid-cols-[2.25rem_1fr] gap-x-3 border-t border-marble/20 py-5 md:grid-cols-[3rem_13rem_1fr] md:gap-x-6 md:py-6">
                    <span className="label pt-1 text-ruby">0{i + 1}</span>
                    <div>
                      <p className="display text-[1.35rem] leading-none text-klein-300 md:text-[1.6rem]">{c.theme}</p>
                      <p className="label mt-2 text-marble/60">{c.ingredient}</p>
                    </div>
                    <p className="col-start-2 mt-3 leading-snug text-marble/90 md:col-start-3 md:mt-0">« {c.claim} »</p>
                  </li>
                ))}
              </ol>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-marble/20 pt-8">
                <ButtonLink href="/produits/cri" variant="marble">Commander CRI · 49 €</ButtonLink>
                <Link href="/methode" className="label underline underline-offset-4 hover:text-white">
                  Allégations autorisées · Règlement (UE) n° 432/2012 →
                </Link>
              </div>
            </div>
            <div className="relative min-h-72 md:min-h-0">
              <Image
                src="/home/hero-2-9x16.webp"
                alt="Le poing de marbre de la statue, strap rouge au poignet, serre une barre couverte de craie au-dessus d'un pot SCULT CRI"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover object-[50%_18%]"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
