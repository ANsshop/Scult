import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { CTA, FooterLinks, MENTION, SIGNATURE } from "./shared";

/**
 * Proposition 3 — « La dalle ». Le footer clair : une dalle de marbre vue de
 * dessus, poudrée de craie, le strap rouge posé dessus. Le mot SCULT est
 * imprimé en bleu dans la pierre (fusion « multiply »), le texte est à l'encre.
 */
export function FooterDalle() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-marble text-ink">
      <Image src="/footer/dalle.webp" alt="" fill sizes="100vw" className="object-cover object-[28%_50%] md:object-[85%_50%]" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-marble/70 via-marble/25 to-transparent" />
      <div className="relative mx-auto max-w-[1360px] px-5 pb-10 pt-16 md:px-10 md:pt-24">
        <p aria-hidden className="display select-none text-[clamp(5rem,22vw,20rem)] leading-[0.8] text-klein mix-blend-multiply">Scult</p>
        <div className="mt-12 grid gap-12 md:mt-16 md:grid-cols-[1fr_1.3fr] md:gap-16 md:pr-[24%]">
          <div>
            <p className="display text-[clamp(1.75rem,3vw,2.75rem)]">{SIGNATURE}</p>
            <ButtonLink href={CTA.href} variant="ink" className="mt-7">{CTA.label}</ButtonLink>
          </div>
          <FooterLinks muted="text-stone" />
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-ink/20 pt-6 md:mt-20 md:flex-row md:items-end md:justify-between">
          <p className="max-w-xl text-[0.8rem] leading-relaxed text-ink/70">{MENTION}</p>
          <p className="label text-ink/70">© {new Date().getFullYear()} SCULT · Fabriqué dans l&apos;UE · Lot 001</p>
        </div>
      </div>
    </footer>
  );
}
