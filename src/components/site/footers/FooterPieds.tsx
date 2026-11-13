import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Wordmark } from "../Wordmark";
import { CTA, FooterLinks, MENTION, SIGNATURE } from "./shared";

/**
 * Proposition 1 — « Le pied de page ». Pris au mot : en bas de la page, les
 * pieds de la statue sur son socle, la craie, le strap tombé. Le mur bleu
 * au-dessus porte la signature, le bouton et les liens.
 */
export function FooterPieds() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-klein text-marble">
      {/* Mobile : les pieds tiennent dans une bande en bas, sous le texte. Ordinateur : l'image remplit le footer. */}
      <div className="absolute inset-x-0 bottom-0 h-60 md:inset-0 md:h-auto">
        <Image src="/footer/pieds.webp" alt="" fill sizes="100vw" className="object-cover object-[88%_100%] md:object-[82%_100%]" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-klein via-klein/10 to-transparent md:bg-gradient-to-r md:from-klein/80 md:via-klein/30" />
      </div>
      {/* Sous les dernières lignes, le socle s'assombrit pour qu'elles restent lisibles */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 hidden h-56 bg-gradient-to-t from-ink/70 to-transparent md:block md:w-[62%] md:[mask-image:linear-gradient(to_right,black_60%,transparent)]" />
      <div className="relative mx-auto max-w-[1360px] px-5 pb-64 pt-20 md:px-10 md:pb-10 md:pt-28">
        <p className="display max-w-4xl text-[clamp(2.75rem,7vw,6.5rem)]">{SIGNATURE}</p>
        <ButtonLink href={CTA.href} variant="marble" className="mt-8">{CTA.label}</ButtonLink>
        <FooterLinks muted="text-marble/70" className="mt-16 md:mt-20 md:max-w-[56%]" />
        <div className="mt-14 flex flex-col gap-6 md:mt-24 md:max-w-[56%] md:flex-row md:items-end md:justify-between">
          <Wordmark className="h-6 w-auto self-start" />
          <p className="max-w-sm text-[0.8rem] leading-relaxed text-marble/80">{MENTION}</p>
        </div>
        <p className="label mt-8 text-marble/70">© {new Date().getFullYear()} SCULT · Fabriqué dans l&apos;UE · Lot 001</p>
      </div>
    </footer>
  );
}
