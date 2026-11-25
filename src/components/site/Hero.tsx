import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { imageSize, imageSrcSet, imageUrl, type ImageName } from "@/lib/content/images";
import { HERO, HERO_POCHES } from "@/lib/content/site";
import { BOITE_POCHONS } from "@/lib/content/modeles-3d";
import { HeroSlider } from "./HeroSlider";
import { Pot3D } from "./Pot3D";

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
 * Le hero de l'accueil : un slider de deux visuels (HeroSlider pose les
 * commandes). Les textes sont dans lib/content/site.ts.
 *
 *  1. Le pré-workout : le vrai contenu de la page — le h1, les dosages, le
 *     bouton. C'est cette slide que l'intro rose recouvre puis révèle.
 *  2. Le nouveau produit, les pochons de caféine : une créa sur papier blanc,
 *     dans le style de la section « T'as cru quoi ? », avec la boîte en 3D
 *     posée sur la boîte centrale. Une annonce, sans prix ni fiche.
 */
export function Hero() {
  const pied = (a: Affiche) => (
    <>
      <p className="text-balance text-[0.95rem] leading-relaxed text-doux">{a.text}</p>
      {a.secondary && <Link href={a.secondary.href} className={`${LIEN} mt-5 inline-block`}>{a.secondary.label}</Link>}
    </>
  );
  const pre: Affiche = { ...HERO, images: { desktop: "hero-dark-desktop", mobile: "hero-dark-mobile" } };
  return (
    <HeroSlider
      legal={HERO.legal}
      slides={[
        { id: "pre-workout", label: "le pré-workout", node: <SlideAffiche first {...pre} />, pied: pied(pre) },
        { id: "poches", label: "les pochons de caféine", clair: true, node: <SlideCrea />, pied: pied({ ...pre, ...HERO_POCHES }) },
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

/** Où poser la boîte 3D sur la créa : centre et largeur en % de l'image, inclinaison, angle de vue. */
const BOITE = {
  desktop: { x: 63.7, y: 50.3, width: 39.5 },
  // La version mobile est la partie droite de la créa (44 % → 100 %, scripts/bouffon-images.mjs) : mêmes repères, recalculés.
  mobile: { x: 35.2, y: 50.3, width: 70.5 },
  tilt: -2,
  orbit: "-17deg 86deg 135%",
};

/**
 * L'annonce des pochons : la créa « La caféine en poche. », papier blanc,
 * lettrage au pinceau, boîtes qui volent. La boîte en 3D recouvre la boîte
 * centrale peinte ; on la fait tourner à la souris ou au doigt. Sans 3D, la
 * boîte peinte reste. La 3D ne se charge que quand la slide est montrée
 * (Pot3D attend la fin de `inert`) : rien n'est pris à l'image du bouffon.
 *
 * Ordinateur : la créa entière (`.hero-scene`, globals.css), son titre peint
 * dans l'image, le bouton en bas à gauche. Mobile : le titre en texte, en
 * haut, puis la partie droite de la créa — les boîtes —, le bouton en bas.
 */
function SlideCrea() {
  const desktop = imageSize("hero-poches-desktop");
  const mobile = imageSize("hero-poches-mobile");
  const pot = (place: { x: number; y: number; width: number }) => (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${place.x}%`, top: `${place.y}%`, width: `${place.width}%`, rotate: `${BOITE.tilt}deg` }}>
      <Pot3D model={BOITE_POCHONS} alt="" orbit={BOITE.orbit} />
    </div>
  );
  const actions = (
    <>
      {/* Sur un téléphone très court, la pastille tomberait sur le bas de la boîte : on ne garde que le bouton */}
      <p className="label rounded-full bg-rose px-3 py-1 font-bold text-noir max-lg:[@media(max-height:620px)]:hidden">{HERO_POCHES.badge}</p>
      <ButtonLink href={HERO_POCHES.cta.href} className="h-[3.25rem] w-full shrink-0 whitespace-nowrap !text-[0.85rem] lg:h-14 lg:w-auto lg:px-10">{HERO_POCHES.cta.label}</ButtonLink>
    </>
  );
  return (
    <div className="hero-crea absolute inset-0 overflow-hidden text-noir">
      {/* Ordinateur : la créa entière, la boîte 3D par-dessus */}
      <div className="hidden lg:block">
        <div className="hero-scene">
          <picture>
            <source type="image/avif" srcSet={imageSrcSet("hero-poches-desktop", "avif")} sizes="100vw" />
            <source type="image/webp" srcSet={imageSrcSet("hero-poches-desktop", "webp")} sizes="100vw" />
            <img src={imageUrl("hero-poches-desktop", 1440)} alt={HERO_POCHES.alt} width={desktop.width} height={desktop.height} loading="lazy" fetchPriority="low" decoding="async" className="absolute inset-0 h-full w-full" />
          </picture>
          {pot(BOITE.desktop)}
        </div>
        <div className={`absolute bottom-[5.5rem] left-0 flex items-center gap-5 ${COLONNE}`}>
          {actions}
          <Link href={HERO_POCHES.secondary.href} className={LIEN}>{HERO_POCHES.secondary.label}</Link>
        </div>
      </div>

      {/* Mobile : le titre en texte, les boîtes dessous, le bouton en bas */}
      <div className="flex h-full flex-col lg:hidden">
        <div className="px-5 pt-[calc(var(--entete)+0.9rem)] text-center">
          <h2 className="display text-[min(10vw,5.8svh,4rem)]">
            {HERO_POCHES.title.main}<br /><span className="text-rose">{HERO_POCHES.title.accent}</span>
          </h2>
        </div>
        <div className="relative mt-1 w-full" style={{ aspectRatio: `${mobile.width} / ${mobile.height}` }}>
          <picture>
            <source type="image/avif" srcSet={imageSrcSet("hero-poches-mobile", "avif")} sizes="100vw" />
            <source type="image/webp" srcSet={imageSrcSet("hero-poches-mobile", "webp")} sizes="100vw" />
            <img src={imageUrl("hero-poches-mobile", 780)} alt={HERO_POCHES.alt} width={mobile.width} height={mobile.height} loading="lazy" fetchPriority="low" decoding="async" className="hero-crea-fondu absolute inset-0 h-full w-full" />
          </picture>
          {pot(BOITE.mobile)}
        </div>
        <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-2.5 px-5">{actions}</div>
      </div>
    </div>
  );
}
