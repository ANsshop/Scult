import type { FaqItem } from "@/lib/content/faq";

/**
 * Les questions en accordéon : on clique sur une question, sa réponse se
 * déplie ; ouvrir une question referme la précédente (attribut `name`).
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
            <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink/25 text-lg leading-none transition-all duration-300 group-open:rotate-45 group-open:border-klein group-open:bg-klein group-open:text-marble">
              +
            </span>
          </summary>
          <p className="max-w-2xl pb-6 pr-12 leading-relaxed text-stone">{i.answer}</p>
        </details>
      ))}
    </div>
  );
}
