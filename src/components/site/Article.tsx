import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ToggleArrow } from "@/components/ui/ToggleArrow";
import type { Qa, Section, Source } from "@/lib/content/guides";
import { HERO } from "@/lib/content/site";

const dateFr = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

/**
 * Le gabarit des pages de fond (guide, fiches d'ingrédients) : un fil
 * d'Ariane, le titre, l'essentiel en tête, puis les sections, les questions,
 * les sources et la date. Tout est dans le HTML servi : rien ne se charge
 * après coup, ce que lisent aussi les moteurs qui n'exécutent pas de script.
 */
export function Article({ crumbs, eyebrow, title, intro, summaryTitle = "En bref", summary, facts, sections, questions, sources, updated, children }: {
  crumbs: { name: string; path: string }[];
  eyebrow: string;
  title: string;
  intro: string;
  summaryTitle?: string;
  /** L'essentiel en quelques phrases… */
  summary?: string[];
  /** …ou en deux colonnes (intitulé, valeur). */
  facts?: [string, string][];
  sections: Section[];
  questions: Qa[];
  sources: Source[];
  updated: string;
  /** Ce qui se place entre les sections et les questions (liens vers d'autres pages). */
  children?: React.ReactNode;
}) {
  return (
    <article>
      <Container className="max-w-3xl py-12 md:py-20">
        <nav aria-label="Fil d'Ariane" className="label text-discret">
          <ol className="flex flex-wrap gap-x-2 gap-y-1">
            {crumbs.map((c, i) => (
              <li key={c.path} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden>/</span>}
                {i < crumbs.length - 1 ? <Link href={c.path} className="hover:text-rose">{c.name}</Link> : <span aria-current="page" className="text-texte">{c.name}</span>}
              </li>
            ))}
          </ol>
        </nav>
        <p className="label mt-8 text-rose">{eyebrow}</p>
        <h1 className="display mt-4 text-[clamp(2.1rem,5.4vw,3.9rem)] !leading-[0.92]">{title}</h1>
        <p className="mt-7 text-[1.15rem] leading-relaxed text-doux">{intro}</p>

        <section aria-labelledby="en-bref" className="mt-10 rounded-card border bg-surface p-6 md:p-8">
          <h2 id="en-bref" className="label text-discret">{summaryTitle}</h2>
          {summary && <ul className="mt-4 space-y-2.5">{summary.map((s) => <li key={s} className="flex gap-3 leading-relaxed"><span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" /><span>{s}</span></li>)}</ul>}
          {facts && (
            <dl className="mt-4 divide-y">
              {facts.map(([label, value]) => (
                <div key={label} className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr] sm:gap-6">
                  <dt className="text-[0.9rem] text-discret">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {sections.map((s) => (
          <section key={s.heading} className="mt-12">
            <h2 className="display text-[clamp(1.5rem,3.2vw,2.2rem)] !leading-[0.95]">{s.heading}</h2>
            {s.paragraphs.map((p) => <p key={p} className="mt-5 text-[1.05rem] leading-[1.75] text-doux">{p}</p>)}
          </section>
        ))}

        {children}

        {questions.length > 0 && (
          <section className="mt-14">
            <h2 className="display text-[clamp(1.5rem,3.2vw,2.2rem)] !leading-[0.95]">Questions fréquentes</h2>
            <div className="mt-6 divide-y border-y">
              {questions.map((q) => (
                <details key={q.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-bold [&::-webkit-details-marker]:hidden"><h3>{q.question}</h3><ToggleArrow /></summary>
                  <p className="mt-4 leading-relaxed text-doux">{q.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14">
          <h2 className="label text-discret">Sources</h2>
          <ul className="mt-4 space-y-2.5 text-[0.95rem]">
            {sources.map((s) => <li key={s.url}><a href={s.url} rel="noopener" target="_blank" className="underline decoration-rose decoration-2 underline-offset-4 hover:text-rose">{s.label}</a></li>)}
          </ul>
          <p className="mt-8 text-[0.9rem] leading-relaxed text-discret">
            Rédigé par l&apos;équipe SCULT. Mis à jour le <time dateTime={updated}>{dateFr(updated)}</time>. Cette page informe, elle ne remplace pas l&apos;avis d&apos;un professionnel de santé. Une erreur ? Écrivez-nous : <a href="mailto:hello@scult.eu" className="underline underline-offset-4">hello@scult.eu</a>.
          </p>
        </section>
      </Container>

      <section className="sombre bg-fond">
        <Container className="flex flex-col items-start gap-6 py-14 md:flex-row md:items-center md:justify-between md:py-16">
          <div>
            <p className="label text-discret">{HERO.eyebrow}</p>
            <p className="display mt-3 text-[clamp(1.8rem,4vw,3rem)]">CRI, les doses <span className="text-rose">écrites sur le pot.</span></p>
            <p className="mt-3 text-doux">{HERO.text}</p>
          </div>
          <ButtonLink href="/produits/cri" className="h-14 shrink-0 px-10">Voir le pré-workout</ButtonLink>
        </Container>
      </section>
    </article>
  );
}

/** La liste des fiches d'ingrédients, en cartes. */
export function IngredientLinks({ items, title }: { items: { slug: string; name: string; note: string }[]; title: string }) {
  return (
    <section className="mt-14">
      <h2 className="display text-[clamp(1.5rem,3.2vw,2.2rem)] !leading-[0.95]">{title}</h2>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.slug}>
            <Link href={`/ingredients/${i.slug}`} className="carte-reflet flex h-full items-center justify-between gap-4 rounded-card border bg-surface p-5 transition-colors hover:border-rose">
              <span><span className="display block text-[1.15rem]">{i.name}</span><span className="mt-1.5 block text-[0.9rem] text-doux">{i.note}</span></span>
              <span aria-hidden className="text-rose">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
