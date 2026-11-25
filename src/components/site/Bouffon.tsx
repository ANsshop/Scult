import { Container } from "@/components/ui/Container";
import { BOUFFON } from "@/lib/content/site";
import { Picture } from "./Picture";

/**
 * Section « Le bouffon » de l'accueil (ancre #bouffon) : la mascotte de face,
 * son nom, et le texte qui la présente — à fournir (lib/content/site.ts).
 */
export function Bouffon() {
  return (
    <section id="bouffon" className="sombre scroll-mt-(--entete) border-b bg-fond text-texte">
      <Container className="grid items-center gap-10 py-20 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16 md:py-28">
        <div className="relative isolate mx-auto w-full max-w-md md:max-w-none">
          <Picture name="bouffon-face" alt={BOUFFON.alt} sizes="(min-width: 768px) 42vw, 100vw" className="block h-auto w-full rounded-card" />
          {/* Le cadre décalé : le rose, en aplat dur, comme l'ombre des titres */}
          <span aria-hidden className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rounded-card bg-rose" />
        </div>
        <div>
          <p className="label text-discret">{BOUFFON.eyebrow}</p>
          <h2 className="display ombre-titre mt-4 text-[clamp(3rem,8vw,7rem)]">{BOUFFON.title}</h2>
          <p className="mt-8 max-w-xl leading-relaxed text-doux">{BOUFFON.text}</p>
        </div>
      </Container>
    </section>
  );
}
