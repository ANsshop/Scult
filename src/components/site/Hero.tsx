import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { imageSize, imageSrcSet, imageUrl } from "@/lib/content/images";
import { HERO, HERO_OFFRE } from "@/lib/content/site";
import { HeroSlider } from "./HeroSlider";

/** Les mêmes `sizes` pour le préchargement et pour l'image, sinon le navigateur télécharge deux fichiers. */
const SIZES_MOBILE = "100vw";
// Plein cadre en `object-cover` : sur un écran plus haut que le 16:9, l'image déborde en largeur.
const SIZES_DESKTOP = "(min-aspect-ratio: 16/9) 100vw, 178vh";
const SIZES_PORTRAIT = "(min-aspect-ratio: 9/16) 100vw, 57vh";
// Toute la largeur, moins si l'écran est très large pour sa hauteur.
const SIZES_PAYSAGE = "(min-aspect-ratio: 2/1) 190vh, 100vw";
const MOBILE = "(max-width: 767px)";
const DESKTOP = "(min-width: 768px)";
/** La créa de l'offre n'a pas de mise en page à elle : on choisit son format sur la forme de l'écran (comme `.hero-offre-image`, globals.css). */
const PORTRAIT = "(orientation: portrait)";

/** La colonne de texte, calée sur la grille du site (1360 px). */
const COLONNE = "md:pl-[max(2.5rem,calc((100vw-1360px)/2+2.5rem))]";

/**
 * Le hero de l'accueil : un slider de deux visuels (HeroSlider pose les
 * commandes). Les textes sont dans lib/content/site.ts.
 *
 *  1. Le bouffon (hero dark) : le vrai contenu de la page — le h1, les
 *     dosages, le bouton. C'est lui que l'intro rose recouvre puis révèle.
 *  2. L'offre : la créa « −30 % sur le deuxième pot », titre peint dans
 *     l'image (d'où son `alt`), et un bouton.
 */
export function Hero() {
  return (
    <HeroSlider
      legal={HERO.legal}
      slides={[
        { id: "bouffon", label: "le bouffon", node: <SlideBouffon /> },
        { id: "offre", label: "l'offre", clair: true, node: <SlideOffre /> },
      ]}
      pied={
        <>
          <p className="text-balance text-[0.95rem] leading-relaxed text-doux">{HERO.text}</p>
          <Link href={HERO.secondary.href} className="label mt-5 inline-block underline decoration-rose decoration-2 underline-offset-[6px] hover:text-rose">{HERO.secondary.label}</Link>
        </>
      }
    />
  );
}

/**
 * Ordinateur : image plein cadre, le bouffon à droite ; un voile noir de
 * gauche à droite garde le texte lisible ; le bloc de texte est calé à gauche,
 * un peu au-dessus du milieu.
 * Mobile : tout tient dans un écran. L'affiche 9:16 est réglée sur la hauteur
 * (jamais recadrée en haut ni en bas : le pot reste entier), ses bords fondus
 * dans le noir ; le titre au-dessus du bonnet, le bouton sous le pot. La ligne
 * de dosages est sous le slider (HeroSlider, `pied`).
 *
 * L'image est le plus grand élément de la page (LCP) : elle est préchargée,
 * en priorité haute, avec ses dimensions.
 */
function SlideBouffon() {
  const desktop = imageSize("hero-dark-desktop");
  const mobile = imageSize("hero-dark-mobile");
  return (
    <div className={`sombre relative isolate h-full overflow-hidden bg-fond md:flex md:min-h-[max(100svh,40rem)] md:flex-col md:justify-center md:pb-[6svh]`}>
      <link rel="preload" as="image" type="image/avif" media={MOBILE} imageSrcSet={imageSrcSet("hero-dark-mobile", "avif")} imageSizes={SIZES_MOBILE} fetchPriority="high" />
      <link rel="preload" as="image" type="image/avif" media={DESKTOP} imageSrcSet={imageSrcSet("hero-dark-desktop", "avif")} imageSizes={SIZES_DESKTOP} fetchPriority="high" />

      {/* La barre rose, du bord gauche, sous la navigation */}
      <span aria-hidden className="absolute left-0 top-(--entete) z-10 h-1.5 w-[min(44vw,36rem)] bg-rose" />

      {/* Sur-titre et titre. Mobile : le titre seul, entre la navigation et le bonnet. */}
      <div className={`absolute inset-x-0 top-0 z-10 px-5 pt-[calc(var(--entete)+0.9rem)] text-center md:static md:w-[min(46rem,50vw)] md:pr-0 md:pt-0 md:text-left ${COLONNE}`}>
        <p className="label hidden text-doux md:block">{HERO.eyebrow}</p>
        {/* `data-texte` : le double rose du titre, qui saute pendant le glitch (intro.css) */}
        <h1 data-texte={`${HERO.title.main}\n${HERO.title.accent}`} className="hero-titre display ombre-titre text-[min(11.2vw,6.5svh,4.25rem)] md:mt-5 md:text-[clamp(3.25rem,7.8vw,7rem)]">
          {HERO.title.main}<br /><span className="text-rose [text-shadow:none]">{HERO.title.accent}</span>
        </h1>
      </div>

      {/* L'image. Ordinateur : plein cadre, derrière le texte. Mobile : toute la hauteur moins la place du bouton. */}
      <div className="absolute inset-x-0 bottom-[6.25rem] top-0 -z-10 md:bottom-0">
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
            className="absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2 max-md:[mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)] md:left-0 md:w-full md:translate-x-0 md:object-cover md:object-[100%_50%]"
          />
        </picture>
        {/* Voile de lisibilité : noir à gauche, transparent vers 62 % (ordinateur) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(0_0_0/0.72)_0%,rgb(0_0_0/0.5)_30%,transparent_62%)] md:block" />
        {/* Voile du haut, sous la navigation */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/75 to-transparent" />
        {/* Mobile : le bas de l'affiche se fond dans le noir, au-dessus du bouton */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-fond to-transparent md:hidden" />
      </div>

      {/* Texte et boutons. Mobile : le bouton seul, en bas de l'écran. */}
      <div className={`absolute inset-x-0 bottom-10 px-5 md:static md:w-[min(46rem,50vw)] md:pr-0 md:pt-8 ${COLONNE}`}>
        <p className="hidden text-balance text-[1.05rem] leading-relaxed text-doux md:block">{HERO.text}</p>
        <div className="flex flex-col md:mt-9 md:flex-row md:items-center md:gap-8">
          <ButtonLink href={HERO.cta.href} className="h-[3.25rem] w-full !text-[0.85rem] md:h-14 md:w-auto md:px-10">{HERO.cta.label}</ButtonLink>
          <Link href={HERO.secondary.href} className="label hidden underline decoration-rose decoration-2 underline-offset-[6px] hover:text-rose md:inline">{HERO.secondary.label}</Link>
        </div>
      </div>
    </div>
  );
}

/**
 * La créa de l'offre : format paysage ou portrait selon l'écran, jamais
 * recadrée dans son texte (`.hero-offre-image`, globals.css).
 * Elle n'est pas visible à l'arrivée : chargée en basse priorité, pour ne rien
 * prendre à l'image du bouffon.
 */
function SlideOffre() {
  const desktop = imageSize("hero-offre-desktop");
  const mobile = imageSize("hero-offre-mobile");
  return (
    <div className="hero-offre absolute inset-0 overflow-hidden">
      <picture>
        <source media={PORTRAIT} type="image/avif" srcSet={imageSrcSet("hero-offre-mobile", "avif")} sizes={SIZES_PORTRAIT} width={mobile.width} height={mobile.height} />
        <source media={PORTRAIT} type="image/webp" srcSet={imageSrcSet("hero-offre-mobile", "webp")} sizes={SIZES_PORTRAIT} width={mobile.width} height={mobile.height} />
        <source type="image/avif" srcSet={imageSrcSet("hero-offre-desktop", "avif")} sizes={SIZES_PAYSAGE} width={desktop.width} height={desktop.height} />
        <source type="image/webp" srcSet={imageSrcSet("hero-offre-desktop", "webp")} sizes={SIZES_PAYSAGE} width={desktop.width} height={desktop.height} />
        <img
          src={imageUrl("hero-offre-desktop", 1440)}
          alt={HERO_OFFRE.alt}
          width={desktop.width}
          height={desktop.height}
          loading="lazy"
          fetchPriority="low"
          decoding="async"
          className="hero-offre-image"
        />
      </picture>
      {/* Le bouton est dans un bloc en absolu : la classe du reflet lui impose `position: relative` */}
      <div className={`absolute inset-x-0 bottom-10 px-5 md:inset-x-auto md:bottom-[5.5rem] md:left-0 md:pr-0 ${COLONNE}`}>
        <ButtonLink href={HERO_OFFRE.cta.href} className="h-[3.25rem] w-full !text-[0.85rem] md:h-14 md:w-auto md:px-10">{HERO_OFFRE.cta.label}</ButtonLink>
      </div>
    </div>
  );
}
