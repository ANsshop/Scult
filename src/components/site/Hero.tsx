import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { imageSize, imageSrcSet, imageUrl, type ImageName } from "@/lib/content/images";
import { HERO, HERO_POCHES } from "@/lib/content/site";
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

const LIEN = "label underline decoration-rose decoration-2 underline-offset-[6px] hover:text-rose";

type Affiche = {
  /** Les deux formats du visuel : paysage (ordinateur) et portrait (mobile, tablette debout). */
  images: { desktop: ImageName; mobile: ImageName };
  alt: string;
  /** Sur-titre discret (ordinateur seulement) ou pastille rose (ordinateur : au-dessus du titre ; mobile : au-dessus du bouton). */
  eyebrow?: string;
  badge?: string;
  /** `accent` est la partie en rose. */
  title: { main: string; accent: string };
  text: string;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
};

/**
 * Le hero de l'accueil : un slider de deux affiches du bouffon (HeroSlider
 * pose les commandes), même mise en page. Les textes sont dans lib/content/site.ts.
 *
 *  1. Le pré-workout : le vrai contenu de la page — le h1, les dosages, le
 *     bouton. C'est cette slide que l'intro rose recouvre puis révèle.
 *  2. Le nouveau produit, les pochons de caféine : le bouffon tend la boîte
 *     blanche. Une annonce, sans prix ni fiche ; un lien mène à la boîte en
 *     3D (/pochons).
 */
export function Hero() {
  const pied = (a: Affiche) => (
    <>
      <p className="text-balance text-[0.95rem] leading-relaxed text-doux">{a.text}</p>
      {a.secondary && <Link href={a.secondary.href} className={`${LIEN} mt-5 inline-block`}>{a.secondary.label}</Link>}
    </>
  );
  const pre: Affiche = { ...HERO, images: { desktop: "hero-dark-desktop", mobile: "hero-dark-mobile" } };
  const poches: Affiche = { ...HERO_POCHES, images: { desktop: "hero-poches-desktop", mobile: "hero-poches-mobile" } };
  return (
    <HeroSlider
      legal={HERO.legal}
      slides={[
        { id: "pre-workout", label: "le pré-workout", node: <SlideAffiche first {...pre} />, pied: pied(pre) },
        { id: "poches", label: "les pochons de caféine", node: <SlideAffiche {...poches} />, pied: pied(poches) },
      ]}
    />
  );
}

/**
 * Une affiche du bouffon, plein cadre, et son texte.
 *
 * Ordinateur (à partir de 1024 px ; une tablette tenue debout prend la mise en
 * page mobile, sinon le texte tombe sur le produit) : le bouffon à droite ; un
 * voile noir de gauche à droite garde le texte lisible ; le bloc de texte est
 * calé à gauche, un peu au-dessus du milieu.
 * Mobile : tout tient dans un écran. L'affiche 9:16 remplit l'écran bord à
 * bord, calée en haut ; elle est composée pour ça — le titre au-dessus du
 * bonnet, le bouton sous le produit, dans le noir du bas. Le texte est sous le
 * slider (HeroSlider, `pied`).
 *
 * `first` : la slide d'arrivée. Son titre est le h1 de la page, son image —
 * le plus grand élément de la page (LCP) — est préchargée en priorité haute.
 * Les autres slides ne sont pas visibles à l'arrivée : image en basse priorité.
 */
function SlideAffiche({ first = false, images, alt, eyebrow, badge, title, text, cta, secondary }: Affiche & { first?: boolean }) {
  const desktop = imageSize(images.desktop);
  const mobile = imageSize(images.mobile);
  const Title = first ? "h1" : "h2";
  // Un titre plus long (« La caféine ») est composé plus petit, pour tenir sur deux lignes dans la colonne.
  const size = Math.max(title.main.length, title.accent.length) > 8
    ? "text-[min(10vw,5.8svh,4rem)] lg:text-[clamp(2.75rem,5.9vw,5.5rem)]"
    : "text-[min(11.2vw,6.5svh,4.25rem)] lg:text-[clamp(3.25rem,7.8vw,7rem)]";
  return (
    <div className={`sombre relative isolate h-full overflow-hidden bg-fond lg:flex lg:flex-col lg:justify-center lg:pb-[6svh] ${first ? "lg:min-h-[max(100svh,40rem)]" : ""}`}>
      {first && (
        <>
          <link rel="preload" as="image" type="image/avif" media={MOBILE} imageSrcSet={imageSrcSet(images.mobile, "avif")} imageSizes={SIZES_MOBILE} fetchPriority="high" />
          <link rel="preload" as="image" type="image/avif" media={DESKTOP} imageSrcSet={imageSrcSet(images.desktop, "avif")} imageSizes={SIZES_DESKTOP} fetchPriority="high" />
        </>
      )}

      {/* La barre rose, du bord gauche, sous la navigation */}
      <span aria-hidden className="absolute left-0 top-(--entete) z-10 h-1.5 w-[min(44vw,36rem)] bg-rose" />

      {/* Sur-titre et titre. Mobile : entre la navigation et le bonnet. */}
      <div className={`absolute inset-x-0 top-0 z-10 px-5 pt-[calc(var(--entete)+0.9rem)] text-center lg:static lg:w-[min(46rem,45vw)] lg:pr-0 lg:pt-0 lg:text-left ${COLONNE}`}>
        {eyebrow && <p className="label hidden text-doux lg:block">{eyebrow}</p>}
        {badge && <p className="label hidden rounded-full bg-rose px-3 py-1 font-bold text-noir lg:inline-block">{badge}</p>}
        {/* `data-texte` : le double rose du titre, qui saute pendant le glitch (intro.css) */}
        <Title {...(first ? { "data-texte": `${title.main}\n${title.accent}` } : {})} className={`${first ? "hero-titre " : ""}display ombre-titre lg:mt-5 ${size}`}>
          {title.main}<br /><span className="text-rose [text-shadow:none]">{title.accent}</span>
        </Title>
      </div>

      {/* L'image, plein cadre, derrière le texte */}
      <div className="absolute inset-0 -z-10">
        <picture>
          <source media={MOBILE} type="image/avif" srcSet={imageSrcSet(images.mobile, "avif")} sizes={SIZES_MOBILE} width={mobile.width} height={mobile.height} />
          <source media={MOBILE} type="image/webp" srcSet={imageSrcSet(images.mobile, "webp")} sizes={SIZES_MOBILE} width={mobile.width} height={mobile.height} />
          <source type="image/avif" srcSet={imageSrcSet(images.desktop, "avif")} sizes={SIZES_DESKTOP} width={desktop.width} height={desktop.height} />
          <source type="image/webp" srcSet={imageSrcSet(images.desktop, "webp")} sizes={SIZES_DESKTOP} width={desktop.width} height={desktop.height} />
          <img
            src={imageUrl(images.desktop, 1440)}
            alt={alt}
            width={desktop.width}
            height={desktop.height}
            fetchPriority={first ? "high" : "low"}
            loading={first ? "eager" : "lazy"}
            decoding={first ? undefined : "async"}
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
        <p className="hidden text-balance text-[1.05rem] leading-relaxed text-doux lg:block">{text}</p>
        <div className="flex flex-col items-center gap-2.5 lg:mt-9 lg:flex-row lg:gap-8">
          {/* Mobile : la pastille au-dessus du bouton (en haut, elle tomberait sur le bonnet) */}
          {badge && <p className="label rounded-full bg-rose px-3 py-1 font-bold text-noir lg:hidden">{badge}</p>}
          <ButtonLink href={cta.href} className="h-[3.25rem] w-full !text-[0.85rem] lg:h-14 lg:w-auto lg:px-10">{cta.label}</ButtonLink>
          {secondary && <Link href={secondary.href} className={`${LIEN} hidden lg:inline`}>{secondary.label}</Link>}
        </div>
      </div>
    </div>
  );
}
