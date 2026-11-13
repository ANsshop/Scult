import Image from "next/image";

/** Le pot détouré (200 px) : un pot seul, ou deux pots qui se chevauchent pour le pack. */
const POT = "/home/pot-mini.webp";

/**
 * Vignette produit : `count` pots avec l'ombre dure du flash. Le parent donne
 * la taille et le fond (un bloc en `relative`, souvent bleu) ; avec `group`
 * sur un ancêtre, les pots s'écartent légèrement au survol.
 */
export function PotStack({ count, className = "" }: { count: number; className?: string }) {
  if (count > 1) {
    return (
      <span className={`relative block ${className}`}>
        <Image src={POT} alt="" width={200} height={244} className="flash-shadow absolute left-0 top-[4%] h-[88%] w-auto -rotate-[9deg] transition-transform duration-500 group-hover:-rotate-[12deg]" />
        <Image src={POT} alt="" width={200} height={244} className="flash-shadow absolute right-0 top-[10%] h-[92%] w-auto rotate-[7deg] transition-transform duration-500 group-hover:rotate-[10deg]" />
      </span>
    );
  }
  return (
    <span className={`flex items-center justify-center ${className}`}>
      <Image src={POT} alt="" width={200} height={244} className="flash-shadow h-full w-auto -rotate-[5deg] transition-transform duration-500 group-hover:-rotate-[2deg]" />
    </span>
  );
}
