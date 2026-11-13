import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/**
 * Section 3 de l'accueil : un grand visuel arrondi, une phrase, un lien vers
 * la méthode. Le visuel garde son sujet à droite et le mur bleu vide à
 * gauche ; sur mobile le sujet reste cadré et le texte passe en bas.
 */
export function Statue() {
  return (
    <section className="border-b">
      <Container className="py-6 md:py-10">
        <div className="relative overflow-hidden rounded-card bg-klein text-marble md:h-[78svh]">
          <div className="relative aspect-[5/4] md:absolute md:inset-0 md:aspect-auto">
            <Image
              src="/home/section3-visage.webp"
              alt="Gros plan sur le visage de la statue de marbre qui hurle, la pierre ruisselante, devant un mur bleu"
              fill
              sizes="(min-width: 1360px) 1280px, 100vw"
              className="object-cover object-[94%_50%] md:object-[100%_50%]"
            />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-klein to-transparent md:inset-0 md:h-auto md:bg-gradient-to-r md:from-klein/60 md:via-klein/10" />
          </div>
          <div className="relative p-6 pt-4 md:absolute md:inset-y-0 md:left-0 md:flex md:w-[46%] md:flex-col md:justify-center md:p-12">
            <p className="label text-marble/85">La méthode</p>
            <p className="display mt-4 text-[clamp(2rem,4.2vw,4rem)]">Ce que l&apos;Europe autorise à dire. Rien de plus.</p>
            <ButtonLink href="/methode" variant="marble" className="mt-7 self-start">Lire la méthode</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
