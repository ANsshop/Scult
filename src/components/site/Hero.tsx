import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Corners } from "./Corners";

/**
 * L'idée forte : la statue regarde le produit. Sur desktop le visuel est
 * calé à droite et le texte occupe les 58 % de gauche ; sur mobile le
 * visuel passe en haut, le titre et l'appel dessous, comme une affiche.
 */
export function Hero() {
  return (
    <section className="grain relative bg-klein text-marble">
      <Corners tl="SCULT · 2026" tr="Whey · Créatine · Collagène" bl="Fabriqué dans l'UE" br="Lot 001" />
      <div className="relative">
        <picture>
          <source media="(max-width: 767px)" srcSet="/home/hero-9x16.webp" />
          <img
            src="/home/hero-16x9.webp"
            alt="Un buste de marbre regarde un pot SCULT Whey posé devant lui, sur fond bleu Klein"
            width={2336}
            height={1312}
            fetchPriority="high"
            className="h-[64svh] w-full object-cover object-[50%_100%] md:h-[92svh] md:object-[100%_50%]"
          />
        </picture>
        <div className="flex flex-col justify-center px-5 pb-14 pt-8 md:absolute md:inset-0 md:px-10 md:py-0 md:pr-[42%]">
          <h1 className="display max-w-[11ch] text-[clamp(3rem,8vw,7.5rem)]">
            Trois poudres.<br />Rien d&apos;autre.
          </h1>
          <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-marble/90">
            Whey isolate, créatine, collagène marin. Nature, sans édulcorant, fabriqués dans l&apos;Union européenne. Le tableau nutritionnel au dos, le lot sur le pot.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/produits/trio" variant="marble">Le Trio · 79 €</ButtonLink>
            <ButtonLink href="/methode" variant="outline" className="text-marble hover:border-marble hover:bg-marble hover:text-ink">Ce qu&apos;on peut dire, et pas</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
