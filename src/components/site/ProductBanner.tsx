import { ButtonLink } from "@/components/ui/Button";
import { PRODUCT_BANNER } from "@/lib/content/site";
import { Picture } from "./Picture";

/**
 * Le bandeau en tête de la fiche produit : le pot au premier plan, le bouffon
 * derrière. Ordinateur : l'image entière (16:9, sans recadrage tant que
 * l'écran le permet), le texte dans son tiers gauche, sombre. Mobile : l'image d'abord (recadrée sur le pot), le texte dessous.
 * Le titre n'est pas un `h1` : celui de la page reste le nom du produit.
 */
export function ProductBanner() {
  return (
    <section aria-label="À la une" className="sombre relative isolate overflow-hidden border-b bg-fond md:flex md:min-h-[min(56.25vw,100svh)] md:flex-col md:justify-center">
      <div className="relative md:absolute md:inset-0 md:-z-10">
        <Picture
          name="hero-produit-desktop"
          alt={PRODUCT_BANNER.alt}
          sizes="(min-width: 768px) 100vw, 140vw"
          priority
          className="block h-[80vw] w-full object-cover object-[72%_50%] md:h-full md:object-[70%_30%]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(0_0_0/0.8)_0%,rgb(0_0_0/0.45)_32%,transparent_56%)] md:block" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/75 to-transparent" />
      </div>
      <div className="px-5 pb-10 pt-7 md:w-[min(40rem,44vw)] md:pb-0 md:pl-[max(2.5rem,calc((100vw-1360px)/2+2.5rem))] md:pt-14">
        <p className="display ombre-titre text-[clamp(2.25rem,10vw,3.25rem)] md:text-[clamp(2.75rem,5.2vw,5rem)]">{PRODUCT_BANNER.title}</p>
        <p className="mt-5 text-[0.95rem] leading-relaxed text-doux md:mt-7 md:text-[1.05rem]">{PRODUCT_BANNER.text}</p>
        <ButtonLink href={PRODUCT_BANNER.cta.href} className="mt-7 h-14 w-full text-[1.1rem] md:w-auto md:px-10">{PRODUCT_BANNER.cta.label}</ButtonLink>
      </div>
    </section>
  );
}
