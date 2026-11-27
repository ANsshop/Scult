import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { FOOTER } from "@/lib/content/site";
import { getLaunch } from "@/lib/launch";
import { PaymentMarks } from "./PaymentMarks";
import { Wordmark } from "./Wordmark";

const COLS = [
  { title: "Boutique", links: [["CRI · pré-workout", "/produits/cri"], ["Pochons de caféine", "/produits/pochons"], ["La formule", "/produits/cri#formule"], ["Le bouffon", "/#bouffon"], ["Panier", "/panier"]] },
  { title: "Comprendre", links: [["Guide du pré-workout", "/guide/pre-workout"], ["Citrulline", "/ingredients/citrulline"], ["Bêta-alanine", "/ingredients/beta-alanine"], ["Créatine", "/ingredients/creatine"], ["Caféine", "/ingredients/cafeine"], ["L-théanine", "/ingredients/l-theanine"]] },
  { title: "Aide", links: [["Performance & sources", "/methode"], ["Questions fréquentes", "/faq"], ["Livraison & retours", "/livraison-retours"], ["Nous écrire", "mailto:hello@scult.eu"]] },
  { title: "Légal", links: [["CGV", "/cgv"], ["Mentions légales", "/mentions-legales"], ["Confidentialité", "/confidentialite"]] },
];

/**
 * Pied de page : noir, un filet rose en tête, le sourire du couvercle et le logo, la signature, le
 * bouton, les liens, les mentions. Tout en bas, un lien discret rejoue l'intro
 * de l'accueil (`?intro=1`, voir components/site/intro/script.ts) — une balise
 * <a> ordinaire, pour un vrai chargement de page : c'est lui qui lance l'intro.
 */
export async function Footer() {
  const launch = await getLaunch();
  return (
    <footer className="sombre relative mt-auto border-t-[6px] border-rose bg-fond text-texte">
      <div className="mx-auto max-w-[1360px] px-5 pb-8 pt-14 md:px-10 md:pb-10 md:pt-24">
        <div className="grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16">
          <div>
            <Link href="/" aria-label="SCULT — accueil" className="group inline-block">
              {/* Le sourire chromé du couvercle, emblème de la marque : la photo du couvercle, détourée (public/brand/) */}
              <span className="sourire mb-7 w-[clamp(9rem,17vw,15rem)] origin-left transition-transform duration-500 ease-(--ease-scult) group-hover:scale-[1.04] md:mb-9">
                {/* eslint-disable-next-line @next/next/no-img-element -- deux fichiers fixes, rien à optimiser */}
                <img src="/brand/sourire-chrome.webp" srcSet="/brand/sourire-chrome-480.webp 480w, /brand/sourire-chrome.webp 921w" sizes="(min-width: 768px) 15rem, 9rem" alt="" width={921} height={370} loading="lazy" className="block h-auto w-full" />
              </span>
              <Wordmark className="h-[clamp(2rem,4.8vw,4.25rem)] w-auto" />
            </Link>
            <p className="display mt-6 text-[clamp(1.5rem,2.6vw,2.4rem)] md:mt-8">{FOOTER.signature}</p>
            {launch.open
              ? <ButtonLink href="/produits/cri" className="mt-7">Commander · 49 €</ButtonLink>
              : <ButtonLink href="/produits/cri#liste" className="mt-7">{launch.waitlist ? `Être prévenu · ${launch.when}` : `Sortie · ${launch.when}`}</ButtonLink>}
          </div>

          <nav aria-label="Pied de page" className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
            {COLS.map((c) => (
              <div key={c.title}>
                <p className="label text-discret">{c.title}</p>
                <ul className="mt-3 space-y-3 md:mt-4 md:space-y-2.5">
                  {c.links.map(([label, href]) => (
                    <li key={href}><Link href={href} className="text-[0.9rem] text-doux underline-offset-4 hover:text-rose hover:underline">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 border-t pt-6 md:mt-20">
          <p className="max-w-2xl text-[0.8rem] leading-relaxed text-doux">
            Complément alimentaire. Ne remplace pas une alimentation variée et équilibrée ni un mode de vie sain. Ne pas dépasser la dose journalière recommandée. Tenir hors de portée des jeunes enfants.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <p className="label text-discret">Paiement sécurisé</p>
            <PaymentMarks />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
            <p className="label text-discret">© {new Date().getFullYear()} SCULT · Fabriqué dans l&apos;UE<span className="hidden md:inline"> · Lot 001</span></p>
            {/* Une balise <a>, pas <Link> : il faut un vrai chargement de page pour que l'intro joue */}
            <a href="/?intro=1" className="label text-discret underline underline-offset-4 hover:text-rose">{FOOTER.replay}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
