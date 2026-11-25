import { imageSize, imageSrcSet, imageUrl, type ImageName } from "@/lib/content/images";

/**
 * Un visuel de la DA « bouffon » : AVIF, puis WebP, à la largeur qui convient
 * (`sizes`), avec ses dimensions d'origine pour réserver la place.
 */
export function Picture({ name, alt, sizes, className = "", priority = false }: { name: ImageName; alt: string; sizes: string; className?: string; priority?: boolean }) {
  const { width, height } = imageSize(name);
  return (
    <picture>
      <source type="image/avif" srcSet={imageSrcSet(name, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={imageSrcSet(name, "webp")} sizes={sizes} />
      <img src={imageUrl(name, 800)} alt={alt} width={width} height={height} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={className} />
    </picture>
  );
}
