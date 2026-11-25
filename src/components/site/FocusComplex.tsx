import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import FORMULE from "@/lib/content/cri-formule.json";
import { FOCUS } from "@/lib/content/site";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * « Complexe Focus » d'une étiquette : « Mucuna pruriens (L-DOPA 99 %) » → le
 * nom, et sa précision entre parenthèses, affichée à part.
 */
function split(nom: string): { name: string; detail: string | null } {
  const m = nom.match(/^(.*?)\s*\((.+)\)$/);
  return m ? { name: m[1], detail: m[2] } : { name: nom, detail: null };
}

/**
 * Le complexe Focus mis en avant : un bloc noir, une carte par ingrédient.
 * Les ingrédients et la quantité viennent de cri-formule.json — la source de
 * la fiche produit et de l'étiquette — ; les textes sont dans site.ts (FOCUS).
 * Aucune promesse d'effet : le nom de chaque ingrédient, ce qu'il est, et le
 * poids du complexe par dose (le détail par ingrédient n'est pas communiqué).
 *
 * `cta` : le bouton sous les cartes (accueil : vers la fiche ; fiche : aucun).
 */
export function FocusComplex({ cta }: { cta?: { label: string; href: string } }) {
  const { nom, quantite, ingredients } = FORMULE.complexe;
  const [first, ...rest] = nom.split(" ");
  return (
    <section id="focus" aria-labelledby="focus-titre" className="sombre scroll-mt-(--entete) border-b bg-fond">
      <Container className="py-20 md:py-28">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-16">
          <div>
            <p className="label text-discret">{FOCUS.eyebrow}</p>
            <h2 id="focus-titre" className="display mt-4 text-[clamp(2.6rem,7.4vw,6.25rem)]">
              {first} <span className="text-rose">{rest.join(" ")}</span>
            </h2>
          </div>
          <p className="max-w-md text-[1.02rem] leading-relaxed text-doux md:pb-3 md:text-right">
            {FOCUS.text(ingredients.length, quantite)}
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-3 md:mt-14 md:grid-cols-4 md:gap-4">
          {ingredients.map((ing, i) => {
            const { name, detail } = split(ing.nom);
            const gloss = FOCUS.glosses[ing.nom as keyof typeof FOCUS.glosses];
            return (
              <li key={ing.nom} className="carte-reflet flex min-h-[9.5rem] flex-col rounded-card border bg-surface p-4 md:min-h-[12.5rem] md:p-6">
                <span className="label text-rose tabular-nums">{pad(i + 1)}</span>
                <span className="display mt-auto pt-6 text-[0.875rem] leading-[0.95] md:text-[1.45rem]">{name}</span>
                {detail && <span className="label mt-2 text-texte">{detail}</span>}
                {gloss && <span className="mt-2 text-[0.8rem] leading-snug text-doux md:text-[0.88rem]">{gloss}</span>}
              </li>
            );
          })}
          {/* La dernière case : le poids du complexe, en rose */}
          <li className="flex min-h-[9.5rem] flex-col rounded-card bg-rose p-4 text-noir md:min-h-[12.5rem] md:p-6">
            <span className="label font-bold">{FOCUS.total}</span>
            <span className="display mt-auto pt-6 text-[1.7rem] leading-[0.9] tabular-nums md:text-[2.6rem]">{quantite}</span>
            <span className="label mt-2 font-bold">{FOCUS.per}</span>
          </li>
        </ul>

        {cta && <ButtonLink href={cta.href} variant="outline" className="mt-10 md:mt-12">{cta.label}</ButtonLink>}
      </Container>
    </section>
  );
}
