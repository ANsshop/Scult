import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { imageSize, imageSrcSet, imageUrl } from "@/lib/content/images";
import { HERO } from "@/lib/content/site";

/** Les mêmes `sizes` pour le préchargement et pour l'image, sinon le navigateur télécharge deux fichiers. */
const SIZES_MOBILE = "100vw";
// Plein cadre en `object-cover` : sur un écran plus haut que le 16:9, l'image déborde en largeur.
const SIZES_DESKTOP = "(min-aspect-ratio: 16/9) 100vw, 178vh";
const MOBILE = "(max-width: 767px)";
const DESKTOP = "(min-width: 768px)";

/**
 * Le hero dark de l'accueil : le vrai contenu de la page (h1, liens, image
 * avec son `alt`). L'intro rose n'est qu'une couche posée par-dessus.
 *
 * Ordinateur : image plein cadre, le bouffon à droite ; un voile noir de
 * gauche à droite garde le texte lisible ; le bloc de texte est calé à gauche,
 * un peu au-dessus du milieu ; la mention légale est en bas à gauche.
 * Mobile : image 9:16 entière (jamais recadrée : le titre, dimensionné sur la
 * largeur d'écran, reste ainsi dans son tiers haut, au-dessus du bonnet), puis,
 * sous l'image, le texte et le bouton pleine largeur — le bas du pot reste
 * entièrement visible.
 *
 * L'image est le plus grand élément de la page (LCP) : elle est préchargée,
 * en priorité haute, avec ses dimensions.
 */
export function Hero() {
  const desktop = imageSize("hero-dark-desktop");
  const mobile = imageSize("hero-dark-mobile");
  return (
    <section className="relative isolate overflow-hidden bg-fond md:flex md:min-h-[max(100svh,40rem)] md:flex-col md:justify-center md:pb-[6svh]">
      <link rel="preload" as="image" type="image/avif" media={MOBILE} imageSrcSet={imageSrcSet("hero-dark-mobile", "avif")} imageSizes={SIZES_MOBILE} fetchPriority="high" />
      <link rel="preload" as="image" type="image/avif" media={DESKTOP} imageSrcSet={imageSrcSet("hero-dark-desktop", "avif")} imageSizes={SIZES_DESKTOP} fetchPriority="high" />

      {/* La barre rose, du bord gauche, sous la navigation */}
      <span aria-hidden className="absolute left-0 top-(--entete) z-10 h-1.5 w-[min(44vw,36rem)] bg-rose" />

      {/* Sur-titre et titre. Mobile : posés sur le tiers haut de l'image. */}
      <div className="absolute inset-x-0 top-0 z-10 px-5 pt-[7.1rem] text-center md:static md:w-[min(46rem,50vw)] md:pl-[max(2.5rem,calc((100vw-1360px)/2+2.5rem))] md:pr-0 md:pt-0 md:text-left">
        <p className="label text-doux">{HERO.eyebrow}</p>
        {/* `data-texte` : le double rose du titre, qui saute pendant le glitch (intro.css) */}
        <h1 data-texte={`${HERO.title.main}\n${HERO.title.accent}`} className="hero-titre display ombre-titre mt-2 whitespace-nowrap text-[min(14.5vw,5rem)] md:mt-5 md:whitespace-normal md:text-[clamp(4.5rem,10.4vw,9.375rem)]">
          {HERO.title.main} <br className="hidden md:block" /><span className="text-rose [text-shadow:none]">{HERO.title.accent}</span>
        </h1>
      </div>

      {/* L'image. Ordinateur : plein cadre, derrière le texte. Mobile : dans le flux, le texte suit dessous. */}
      <div className="relative md:absolute md:inset-0 md:-z-10">
        <picture>
          <source media={MOBILE} type="image/avif" srcSet={imageSrcSet("hero-dark-mobile", "avif")} sizes={SIZES_MOBILE} width={mobile.width} height={mobile.height} />
          <source media={MOBILE} type="image/webp" srcSet={imageSrcSet("hero-dark-mobile", "webp")} sizes={SIZES_MOBILE} width={mobile.width} height={mobile.height} />
          <source type="image/avif" srcSet={imageSrcSet("hero-dark-desktop", "avif")} sizes={SIZES_DESKTOP} width={desktop.width} height={desktop.height} />
          <source type="image/webp" srcSet={imageSrcSet("hero-dark-desktop", "webp")} sizes={SIZES_DESKTOP} width={desktop.width} height={desktop.height} />
          <img
            src={imageUrl("hero-dark-desktop", 1440)}
            alt={HERO.alt}
            width={desktop.width}
            height={desktop.height}
            fetchPriority="high"
            loading="eager"
            className="block aspect-[9/16] h-auto w-full object-cover md:aspect-auto md:h-full md:object-[100%_50%]"
          />
        </picture>
        {/* Voile de lisibilité : noir à gauche, transparent vers 62 % (ordinateur) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(0_0_0/0.72)_0%,rgb(0_0_0/0.5)_30%,transparent_62%)] md:block" />
        {/* Voile du haut, sous la navigation */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/75 to-transparent" />
      </div>

      {/* Texte, boutons, mention. Mobile : sous l'image. */}
      <div className="px-5 pb-10 pt-6 md:w-[min(46rem,50vw)] md:pb-0 md:pl-[max(2.5rem,calc((100vw-1360px)/2+2.5rem))] md:pr-0 md:pt-8">
        <p className="text-balance text-[0.95rem] leading-relaxed text-doux md:text-[1.05rem]">{HERO.text}</p>
        <div className="mt-6 flex flex-col gap-5 md:mt-9 md:flex-row md:items-center md:gap-8">
          <ButtonLink href={HERO.cta.href} className="h-14 w-full text-[1.25rem] md:w-auto md:px-10">{HERO.cta.label}</ButtonLink>
          <Link href={HERO.secondary.href} className="label self-center underline decoration-rose decoration-2 underline-offset-[6px] hover:text-rose md:self-auto">{HERO.secondary.label}</Link>
        </div>
        <p className="label mt-8 !text-[0.5625rem] leading-relaxed text-discret md:absolute md:bottom-7 md:mt-0">{HERO.legal}</p>
      </div>
    </section>
  );
}
