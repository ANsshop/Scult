import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { imageSize, imageSrcSet, imageUrl } from "@/lib/content/images";
import { OffrePots } from "./OffrePots";
import { HERO, HERO_OFFRE } from "@/lib/content/site";
import type { FlavourOffer } from "@/lib/catalog/queries";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";
import { HeroSlider } from "./HeroSlider";

/** Les mêmes `sizes` pour le préchargement et pour l'image, sinon le navigateur télécharge deux fichiers. */
const SIZES_MOBILE = "100vw";
// Plein cadre en `object-cover` : sur un écran plus haut que le 16:9, l'image déborde en largeur.
const SIZES_DESKTOP = "(min-aspect-ratio: 16/9) 100vw, 178vh";
const MOBILE = "(max-width: 1023px)";
const DESKTOP = "(min-width: 1024px)";

/**
 * La colonne de texte, calée sur la grille du site (1360 px). `box-content` :
 * la largeur donnée ailleurs est celle du texte, la marge de gauche s'y ajoute
 * (sinon, sur un très grand écran, la marge mange la colonne et le titre se coupe).
 */
const COLONNE = "lg:box-content lg:pl-[max(2.5rem,calc((100vw-1360px)/2+2.5rem))]";

/**
 * Le hero de l'accueil : un slider de deux visuels (HeroSlider pose les
 * commandes). Les textes sont dans lib/content/site.ts.
 *
 *  1. Le bouffon (hero dark) : le vrai contenu de la page — le h1, les
 *     dosages, le bouton. C'est lui que l'intro rose recouvre puis révèle.
 *  2. L'offre : « −30 % sur le deuxième pot » en typographie, les deux pots
 *     en 3D, et un bouton. `offer` (le catalogue) donne le prix du pack,
 *     écrit sur le bouton ; sans lui, le bouton reste seul.
 */
export function Hero({ offer }: { offer?: FlavourOffer | null }) {
  return (
    <HeroSlider
      legal={HERO.legal}
      slides={[
        { id: "bouffon", label: "le bouffon", node: <SlideBouffon /> },
        { id: "offre", label: "l'offre", clair: true, node: <SlideOffre pack={offer?.pack ?? null} /> },
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
 * Ordinateur (à partir de 1024 px ; une tablette tenue debout prend la mise en
 * page mobile, sinon le texte tombe sur le pot) : image plein cadre, le bouffon à droite ; un voile noir de
 * gauche à droite garde le texte lisible ; le bloc de texte est calé à gauche,
 * un peu au-dessus du milieu.
 * Mobile : tout tient dans un écran. L'affiche 9:16 remplit l'écran bord à
 * bord, calée en haut ; elle est composée pour ça — le titre au-dessus du
 * bonnet, le bouton sous le pot, dans le noir du bas. La ligne de dosages est
 * sous le slider (HeroSlider, `pied`).
 *
 * L'image est le plus grand élément de la page (LCP) : elle est préchargée,
 * en priorité haute, avec ses dimensions.
 */
function SlideBouffon() {
  const desktop = imageSize("hero-dark-desktop");
  const mobile = imageSize("hero-dark-mobile");
  return (
    <div className={`sombre relative isolate h-full overflow-hidden bg-fond lg:flex lg:min-h-[max(100svh,40rem)] lg:flex-col lg:justify-center lg:pb-[6svh]`}>
      <link rel="preload" as="image" type="image/avif" media={MOBILE} imageSrcSet={imageSrcSet("hero-dark-mobile", "avif")} imageSizes={SIZES_MOBILE} fetchPriority="high" />
      <link rel="preload" as="image" type="image/avif" media={DESKTOP} imageSrcSet={imageSrcSet("hero-dark-desktop", "avif")} imageSizes={SIZES_DESKTOP} fetchPriority="high" />

      {/* La barre rose, du bord gauche, sous la navigation */}
      <span aria-hidden className="absolute left-0 top-(--entete) z-10 h-1.5 w-[min(44vw,36rem)] bg-rose" />

      {/* Sur-titre et titre. Mobile : le titre seul, entre la navigation et le bonnet. */}
      <div className={`absolute inset-x-0 top-0 z-10 px-5 pt-[calc(var(--entete)+0.9rem)] text-center lg:static lg:w-[min(46rem,45vw)] lg:pr-0 lg:pt-0 lg:text-left ${COLONNE}`}>
        <p className="label hidden text-doux lg:block">{HERO.eyebrow}</p>
        {/* `data-texte` : le double rose du titre, qui saute pendant le glitch (intro.css) */}
        <h1 data-texte={`${HERO.title.main}\n${HERO.title.accent}`} className="hero-titre display ombre-titre text-[min(11.2vw,6.5svh,4.25rem)] lg:mt-5 lg:text-[clamp(3.25rem,7.8vw,7rem)]">
          {HERO.title.main}<br /><span className="text-rose [text-shadow:none]">{HERO.title.accent}</span>
        </h1>
      </div>

      {/* L'image, plein cadre, derrière le texte */}
      <div className="absolute inset-0 -z-10">
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
            className="absolute inset-0 h-full w-full object-cover object-top lg:object-[100%_50%]"
          />
        </picture>
        {/* Voile de lisibilité : noir à gauche, transparent vers 62 % (ordinateur) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(0_0_0/0.72)_0%,rgb(0_0_0/0.5)_30%,transparent_62%)] lg:block" />
        {/* Voile du haut, sous la navigation */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/75 to-transparent" />
        {/* Mobile : le bas de l'affiche se fond dans le noir, derrière le bouton */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-fond via-fond/70 to-transparent lg:hidden" />
      </div>

      {/* Texte et boutons. Mobile : le bouton seul, en bas de l'écran. */}
      <div className={`absolute inset-x-0 bottom-10 px-5 lg:static lg:w-[min(46rem,45vw)] lg:pr-0 lg:pt-8 ${COLONNE}`}>
        <p className="hidden text-balance text-[1.05rem] leading-relaxed text-doux lg:block">{HERO.text}</p>
        <div className="flex flex-col lg:mt-9 lg:flex-row lg:items-center lg:gap-8">
          <ButtonLink href={HERO.cta.href} className="h-[3.25rem] w-full !text-[0.85rem] lg:h-14 lg:w-auto lg:px-10">{HERO.cta.label}</ButtonLink>
          <Link href={HERO.secondary.href} className="label hidden underline decoration-rose decoration-2 underline-offset-[6px] hover:text-rose lg:inline">{HERO.secondary.label}</Link>
        </div>
      </div>
    </div>
  );
}

/**
 * L'offre du pack, sans visuel : le chiffre en grand, en typographie, et les
 * deux pots en 3D sur un disque rose. Ordinateur : le texte à gauche, les pots
 * à droite. Mobile : le texte en haut, les pots au milieu, le bouton en bas.
 * Les pots ne chargent leur 3D qu'à la première apparition de la slide
 * (OffrePots) : rien n'est pris à l'image du bouffon.
 */
function SlideOffre({ pack }: { pack: FlavourOffer["pack"] }) {
  const price = pack ? formatPrice(pack.priceCents) : null;
  const saving = pack && pack.fullPriceCents > pack.priceCents;
  const note = pack && [saving ? HERO_OFFRE.instead(formatPrice(pack.fullPriceCents)) : null, pack.priceCents >= FREE_SHIPPING_THRESHOLD_CENTS ? HERO_OFFRE.shipping : null].filter(Boolean).join(" · ");
  return (
    <div className="absolute inset-0 overflow-hidden bg-white text-noir">
      <div className="relative mx-auto flex h-full max-w-[1360px] flex-col px-5 pb-[9.5rem] pt-[calc(var(--entete)+1.25rem)] lg:flex-row lg:items-center lg:gap-6 lg:px-10 lg:pb-[4svh] lg:pt-(--entete)">
        <div className="text-center lg:w-[54%] lg:text-left">
          <p className="label text-discret">{HERO_OFFRE.eyebrow}</p>
          <h2 className="display mt-2 !text-nowrap text-[min(30vw,15.5svh)] !leading-[0.82] text-rose lg:mt-4 lg:text-[min(13.4vw,32svh,12.25rem)]">{HERO_OFFRE.title}</h2>
          <p className="display mt-1 text-[min(8.3vw,4.4svh)] lg:mt-3 lg:text-[min(3.75vw,8svh)]">{HERO_OFFRE.subtitle}</p>
          {/* Mobile : le bouton en bas de l'écran, la précision au-dessus ; ordinateur : sous le texte, la précision à droite */}
          <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-2.5 px-5 lg:static lg:mt-10 lg:flex-row lg:gap-5 lg:px-0">
            {note && <p className="label whitespace-nowrap rounded-full bg-surface px-3.5 py-1.5 font-bold lg:order-2">{note}</p>}
            <ButtonLink href={HERO_OFFRE.cta.href} className="h-[3.25rem] w-full shrink-0 whitespace-nowrap !text-[0.85rem] lg:h-14 lg:w-auto lg:px-10">{HERO_OFFRE.cta.label}{price && <> · {price}</>}</ButtonLink>
          </div>
        </div>
        {/* Les deux pots, devant un disque rose */}
        <div className="relative mt-3 flex min-h-0 flex-1 items-center justify-center lg:mt-0">
          <span aria-hidden className="absolute aspect-square h-[88%] rounded-full bg-rose lg:h-[min(60svh,36vw)]" />
          <OffrePots className="relative h-[92%] lg:h-[min(54svh,31vw)]" />
        </div>
      </div>
    </div>
  );
}
