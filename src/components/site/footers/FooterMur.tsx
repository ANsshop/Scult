import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { CTA, FooterLinks, MENTION, SIGNATURE } from "./shared";

/**
 * Proposition 2 — « Le mur ». Un grand panneau arrondi posé sur la page : le
 * mur bleu peint, ses traces de craie, le mot SCULT en géant, le bouton au
 * centre, les liens en dessous.
 */
export function FooterMur() {
  return (
    <footer className="mt-auto px-3 pb-3 md:px-5 md:pb-5">
      <div className="relative overflow-hidden rounded-card bg-klein text-marble">
        <Image src="/footer/mur.webp" alt="" fill sizes="100vw" className="object-cover object-[75%_50%]" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-klein/85 via-klein/20 to-klein/10" />
        <div className="relative px-6 pb-10 pt-12 md:px-14 md:pb-12 md:pt-16">
          <p className="label flex justify-between text-marble/80"><span>SCULT · EU</span><span>Lot 001</span></p>
          <p aria-hidden className="display mt-6 select-none text-center text-[clamp(5rem,23vw,21rem)] leading-[0.8]">Scult</p>
          <div className="mt-8 flex flex-col items-center gap-5 text-center">
            <p className="display text-[clamp(1.25rem,2.4vw,2rem)]">{SIGNATURE}</p>
            <ButtonLink href={CTA.href} variant="marble">{CTA.label}</ButtonLink>
          </div>
          <div className="mt-14 grid gap-10 border-t border-marble/25 pt-10 md:mt-20 md:grid-cols-[2fr_1fr]">
            <FooterLinks muted="text-marble/70" />
            <div>
              <p className="label text-marble/70">Mention</p>
              <p className="mt-4 text-[0.8rem] leading-relaxed text-marble/85">{MENTION}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="label py-4 text-center text-stone">© {new Date().getFullYear()} SCULT · Fabriqué dans l&apos;UE</p>
    </footer>
  );
}
