import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { CTA, FooterLinks, MENTION, SIGNATURE } from "./shared";

/**
 * Proposition 3 — « La peinture et le pot ». Une matière de peinture bleue
 * épaisse en fond, le mot SCULT en géant, et le pot penché qui dépasse du
 * haut du footer, comme sur la carte produit.
 */
export function FooterPot() {
  return (
    <footer className="relative mt-auto bg-klein text-marble">
      <div className="absolute inset-0 overflow-hidden">
        <Image src="/footer/peinture.webp" alt="" fill sizes="100vw" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-klein/70 via-klein/25 to-transparent" />
      </div>
      {/* Le pot dépasse du bord haut : il relie la page au footer */}
      <div className="pointer-events-none absolute -top-12 right-4 w-28 md:-top-24 md:right-[7%] md:w-[min(24vw,20rem)]">
        <Image src="/home/pot-detoure.webp" alt="" width={900} height={1096} sizes="(min-width: 768px) 24vw, 112px" className="flash-shadow h-auto w-full rotate-[7deg]" />
      </div>
      <div className="relative mx-auto max-w-[1360px] px-5 pb-10 pt-24 md:px-10 md:pt-24">
        <p aria-hidden className="display select-none text-[clamp(5rem,19vw,17rem)] leading-[0.8]">Scult</p>
        <div className="mt-10 grid gap-12 md:mt-14 md:grid-cols-[1fr_1.7fr] md:gap-14 md:pr-[26%]">
          <div>
            <p className="display text-[clamp(1.75rem,3vw,2.75rem)]">{SIGNATURE}</p>
            <ButtonLink href={CTA.href} variant="marble" className="mt-7">{CTA.label}</ButtonLink>
          </div>
          <FooterLinks muted="text-marble/70" />
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-marble/25 pt-6 md:mt-20 md:flex-row md:items-end md:justify-between">
          <p className="max-w-xl text-[0.8rem] leading-relaxed text-marble/85">{MENTION}</p>
          <p className="label text-marble/75">© {new Date().getFullYear()} SCULT · Fabriqué dans l&apos;UE · Lot 001</p>
        </div>
      </div>
    </footer>
  );
}
