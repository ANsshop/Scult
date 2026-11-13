import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { Wordmark } from "@/components/site/Wordmark";

/**
 * Page de travail, à supprimer une fois le logo choisi : les pistes de logo
 * l'une sous l'autre, chacune en grand sur clair et sur bleu, en petit dans une
 * barre de navigation, et en icône. Non indexée, absente du sitemap et du menu.
 */
export const metadata: Metadata = { title: "Aperçu des logos", robots: { index: false, follow: false } };

/** Trois coups de ciseau découpés dans le mot (vrai trou, le fond passe au travers). */
const CHISEL: CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(155deg, #000 0 36%, transparent 36% 38.6%, #000 38.6% 47%, transparent 47% 49.4%, #000 49.4% 58%, transparent 58% 60.4%, #000 60.4%)",
  maskImage:
    "linear-gradient(155deg, #000 0 36%, transparent 36% 38.6%, #000 38.6% 47%, transparent 47% 49.4%, #000 49.4% 58%, transparent 58% 60.4%, #000 60.4%)",
};

type Variant = "pastille" | "ciseau" | "italique" | "plaque" | "actuel";

/** `knock` : la couleur du fond, pour les lettres « percées » de la plaque. */
function Logo({ variant, knock = "var(--color-marble)" }: { variant: Variant; knock?: string }) {
  switch (variant) {
    case "pastille":
      return (
        <span className="display inline-flex items-baseline leading-none">
          Scult
          <span aria-hidden className="ml-[0.07em] inline-block h-[0.2em] w-[0.2em] rounded-full bg-ruby" />
        </span>
      );
    case "ciseau":
      return <span className="display inline-block leading-none" style={CHISEL}>Scult</span>;
    case "italique":
      return (
        <span className="display inline-block origin-left leading-none" style={{ transform: "skewX(-12deg) scaleX(0.8)", letterSpacing: "-0.055em", marginRight: "-0.55em" }}>
          Scult
        </span>
      );
    case "plaque":
      return (
        <span className="inline-flex items-center rounded-full bg-current px-[0.34em] py-[0.13em] leading-none">
          <span className="display text-[0.62em]" style={{ color: knock }}>Scult</span>
        </span>
      );
    default:
      return <Wordmark className="h-[0.72em] w-auto" />;
  }
}

function Icon({ variant }: { variant: Variant }) {
  const box = "flex h-16 w-16 items-center justify-center overflow-hidden rounded-[18px]";
  switch (variant) {
    case "pastille":
      return <span className={`${box} bg-klein text-marble`}><span className="display inline-flex items-baseline text-[2.6rem] leading-none">S<span className="ml-[0.05em] inline-block h-[0.22em] w-[0.22em] rounded-full bg-ruby" /></span></span>;
    case "ciseau":
      return <span className={`${box} bg-klein text-marble`}><span className="display text-[3rem] leading-none" style={CHISEL}>S</span></span>;
    case "italique":
      return <span className={`${box} bg-klein text-marble`}><span className="display text-[3rem] leading-none" style={{ transform: "skewX(-12deg) scaleX(0.85)" }}>S</span></span>;
    case "plaque":
      return <span className={`${box} bg-marble`}><span className="flex h-11 w-11 items-center justify-center rounded-full bg-klein"><span className="display text-[1.9rem] leading-none text-marble">S</span></span></span>;
    default:
      return <span className={`${box} bg-klein text-marble`}><svg viewBox="0 0 96 120" className="h-8 w-auto" fill="currentColor"><rect x="0" y="0" width="96" height="24" /><rect x="0" y="0" width="24" height="72" /><rect x="0" y="48" width="96" height="24" /><rect x="72" y="48" width="24" height="72" /><rect x="0" y="96" width="96" height="24" /></svg></span>;
  }
}

const PROPOSALS: { n: string; variant: Variant; name: string; note: string }[] = [
  { n: "1", variant: "pastille", name: "La pastille", note: "Le mot en lettres pleines, fermé par le point rouge — la pastille du pot, et le point final de la signature." },
  { n: "2", variant: "ciseau", name: "Le ciseau", note: "Le mot griffé de trois coups de ciseau, comme « CRI » sur le pot." },
  { n: "3", variant: "italique", name: "L'italique", note: "Serré et penché, dans le mouvement du mot « CRI »." },
  { n: "4", variant: "plaque", name: "La plaque", note: "Le mot percé dans une pilule pleine, comme les boutons du site." },
  { n: "0", variant: "actuel", name: "L'actuel", note: "Pour comparer : le logo en blocs d'aujourd'hui." },
];

function Stage({ className, children }: { className: string; children: ReactNode }) {
  return <div className={`flex min-h-56 items-center justify-center px-6 py-10 text-[clamp(3.5rem,9vw,7.5rem)] ${className}`}>{children}</div>;
}

export default function Page() {
  return (
    <main>
      {PROPOSALS.map((p) => (
        <section key={p.n} className="border-b border-ink">
          <div className="bg-ink px-5 py-4 text-marble md:px-10">
            <p className="label">Piste {p.n} — {p.name}</p>
            <p className="mt-1 text-sm text-marble/70">{p.note}</p>
          </div>
          <div className="grid md:grid-cols-2">
            <Stage className="bg-marble text-ink"><Logo variant={p.variant} knock="var(--color-marble)" /></Stage>
            <Stage className="bg-klein text-marble"><Logo variant={p.variant} knock="var(--color-klein)" /></Stage>
          </div>
          <div className="grid items-center gap-6 bg-white px-5 py-6 md:grid-cols-[1fr_auto] md:px-10">
            {/* En situation : la barre de navigation */}
            <div className="flex h-14 items-center justify-between rounded-full bg-klein px-6 text-marble">
              <span className="text-[1.5rem]"><Logo variant={p.variant} knock="var(--color-klein)" /></span>
              <span className="label hidden gap-6 sm:flex"><span>CRI</span><span>La formule</span><span>Méthode</span><span>FAQ</span></span>
              <span className="label">Panier</span>
            </div>
            <div className="flex items-center gap-3">
              <Icon variant={p.variant} />
              <span className="label text-stone">Icône</span>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
