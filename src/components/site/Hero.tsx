import { ButtonLink } from "@/components/ui/Button";
import { Corners } from "./Corners";

/**
 * DA « Cri » : la statue tend le pot CRI vers l'objectif. Sur desktop le
 * visuel est calé à droite, le texte tient dans la zone de mur bleu laissée
 * vide à gauche (un voile garde le titre lisible si le recadrage la réduit).
 * Sur mobile le visuel passe en haut, le titre et l'appel dessous : le
 * bouton ne recouvre jamais le pot.
 */
export function Hero() {
  return (
    <section className="grain relative bg-klein text-marble">
      <Corners tl="SCULT · 2026" tr="Pré-workout · Fruits rouges" bl="Fabriqué dans l'UE" br="Lot 001" />
      <div className="relative">
        <picture>
          <source media="(max-width: 767px)" srcSet="/home/hero-9x16.webp" width={1280} height={2264} />
          <img
            src="/home/hero-16x9.webp"
            alt="Une statue de marbre qui hurle tend un pot SCULT CRI vers l'objectif, devant un mur bleu"
            width={2400}
            height={1357}
            fetchPriority="high"
            className="h-[72svh] w-full object-cover object-[50%_100%] md:h-[92svh] md:object-[100%_50%]"
          />
        </picture>
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-klein/70 via-klein/25 to-transparent md:block md:w-[55%]" />
        <div className="flex flex-col justify-center px-5 pb-14 pt-8 md:absolute md:inset-0 md:px-10 md:py-0 md:pr-[62%]">
          <p className="label text-marble/85">CRI · le pré-workout SCULT</p>
          <h1 className="display mt-4 text-[clamp(2.6rem,4.4vw,4.75rem)]">
            Rien ne se sculpte en silence.
          </h1>
          <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-marble/90">
            Citrulline 8 g, bêta-alanine 4 g, créatine 3 g, caféine 150 mg par dose. 30 doses, fruits rouges. Les dosages sur le pot, le lot dessous.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/produits/cri" variant="marble">Découvrir CRI · 49 €</ButtonLink>
            <ButtonLink href="/methode" variant="outline" className="text-marble hover:border-marble hover:bg-marble hover:text-ink">Ce qu&apos;on peut dire, et pas</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
