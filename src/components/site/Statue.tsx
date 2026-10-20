import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Corners } from "./Corners";

/** Interlude plein cadre : la texture (poudre sur marbre), une phrase, un lien vers la méthode. */
export function Statue() {
  return (
    <section className="relative bg-klein text-marble">
      <div className="relative h-[70svh] md:h-[85svh]">
        <Image src="/home/texture-16x9.webp" alt="Poudre blanche de créatine sur une dalle de marbre, en plein soleil" fill sizes="100vw" className="object-cover" />
        <Corners tl="Matière" br="Créatine monohydrate · Creapure®" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-klein/90 to-transparent px-5 pb-12 pt-32 md:px-10 md:pb-16">
          <p className="display max-w-4xl text-[clamp(2rem,5.5vw,4.5rem)]">Ce que l&apos;Europe autorise à dire. Rien de plus.</p>
          <ButtonLink href="/methode" variant="marble" className="mt-6">Lire la méthode</ButtonLink>
        </div>
      </div>
    </section>
  );
}
