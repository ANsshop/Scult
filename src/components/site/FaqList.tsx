import { ToggleArrow } from "@/components/ui/ToggleArrow";
import type { FaqItem } from "@/lib/content/faq";

/**
 * Les questions en accordéon : on clique sur une question, sa réponse se
 * déplie ; ouvrir une question referme la précédente (attribut `name`).
 * Une flèche à droite de la question se retourne à l'ouverture.
 * Balises <details> natives : ça marche au clavier, sans JavaScript, et les
 * réponses restent dans la page pour les moteurs de recherche. L'ouverture
 * est animée là où le navigateur le permet (voir `.faq-item` dans globals.css).
 */
export function FaqList({ items, group, className = "" }: { items: FaqItem[]; group: string; className?: string }) {
  return (
    <div className={`divide-y border-y ${className}`}>
      {items.map((i) => (
        <details key={i.question} name={group} className="faq-item group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-medium transition-colors hover:text-klein [&::-webkit-details-marker]:hidden">
            <span>{i.question}</span>
            <ToggleArrow />
          </summary>
          <p className="max-w-2xl pb-6 pr-12 leading-relaxed text-stone">{i.answer}</p>
        </details>
      ))}
    </div>
  );
}
