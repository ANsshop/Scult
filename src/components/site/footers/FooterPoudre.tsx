import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Wordmark } from "../Wordmark";
import { CTA, FooterLinks, MENTION, SIGNATURE } from "./shared";

/**
 * Proposition 1 — « La poudre ». Un mur bleu lumineux et, à droite, un nuage
 * de poudre rose lancé en l'air. La signature en grand, le bouton, les liens.
 */
export function FooterPoudre() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-klein text-marble">
      {/* Mobile : le nuage tient dans une bande en bas, sous le texte. Ordinateur : l'image remplit le footer. */}
      <div className="absolute inset-x-0 bottom-0 h-56 md:inset-0 md:h-auto">
        <Image src="/footer/poudre.webp" alt="" fill sizes="100vw" className="object-cover object-[92%_100%] md:object-[100%_60%]" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-klein via-klein/10 to-transparent md:bg-gradient-to-r md:from-klein/60 md:via-klein/10" />
      </div>
      <div className="relative mx-auto max-w-[1360px] px-5 pb-60 pt-20 md:px-10 md:pb-10 md:pt-28">
        <p className="display max-w-4xl text-[clamp(2.75rem,7vw,6.5rem)]">{SIGNATURE}</p>
        <ButtonLink href={CTA.href} variant="marble" className="mt-8">{CTA.label}</ButtonLink>
        <FooterLinks muted="text-marble/70" className="mt-16 md:mt-20 md:max-w-[56%]" />
        <div className="mt-14 flex flex-col gap-6 md:mt-24 md:max-w-[56%] md:flex-row md:items-end md:justify-between">
          <Wordmark className="h-6 w-auto self-start" />
          <p className="max-w-sm text-[0.8rem] leading-relaxed text-marble/85">{MENTION}</p>
        </div>
        <p className="label mt-8 text-marble/70">© {new Date().getFullYear()} SCULT · Fabriqué dans l&apos;UE · Lot 001</p>
      </div>
    </footer>
  );
}
