import Image from "next/image";
import { getFlavour } from "@/lib/content/flavours";

/**
 * Vignette produit : un pot détouré (200 px), ou deux pots qui se chevauchent
 * pour un pack, chacun avec l'étiquette de son goût et l'ombre dure du flash.
 * Le parent donne la taille et le fond (un bloc en `relative`, souvent bleu) ;
 * avec `group` sur un ancêtre, les pots s'écartent légèrement au survol.
 *
 * `flavours` : le goût de chaque pot. Sans goût connu, c'est le pot d'origine.
 */
export function PotStack({ flavours, className = "" }: { flavours?: (string | undefined)[]; className?: string }) {
  const pots = flavours?.length ? flavours : [undefined];
  if (pots.length > 1) {
    return (
      <span className={`relative block ${className}`}>
        <Image src={getFlavour(pots[0]).mini} alt="" width={200} height={244} className="flash-shadow absolute left-0 top-[4%] h-[88%] w-auto -rotate-[9deg] transition-transform duration-500 group-hover:-rotate-[12deg]" />
        <Image src={getFlavour(pots[1]).mini} alt="" width={200} height={244} className="flash-shadow absolute right-0 top-[10%] h-[92%] w-auto rotate-[7deg] transition-transform duration-500 group-hover:rotate-[10deg]" />
      </span>
    );
  }
  return (
    <span className={`flex items-center justify-center ${className}`}>
      <Image src={getFlavour(pots[0]).mini} alt="" width={200} height={244} className="flash-shadow h-full w-auto -rotate-[5deg] transition-transform duration-500 group-hover:-rotate-[2deg]" />
    </span>
  );
}
