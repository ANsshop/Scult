import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/ui/Container";
import { ClearCartOnMount } from "@/components/cart/ClearCartOnMount";
import { Picture } from "@/components/site/Picture";
import { MERCI } from "@/lib/content/site";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Merci", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MerciPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  if (!session_id) notFound();
  let paid = false;
  let email = "";
  try {
    const s = await stripe().checkout.sessions.retrieve(session_id);
    paid = s.payment_status === "paid";
    email = s.customer_details?.email ?? "";
  } catch { /* clé absente en dev : on affiche l'état d'attente */ }
  return (
    <>
      <Header />
      {paid && <ClearCartOnMount />}
      <main>
        <Container className="grid items-center gap-10 py-16 md:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] md:gap-16 md:py-24">
          <Picture name="bouffon-applaudit" alt={MERCI.alt} sizes="(min-width: 768px) 36vw, 100vw" priority className="mx-auto block h-auto w-full max-w-sm md:max-w-none" />
          <div>
            <p className="label text-rose">Commande</p>
            <h1 className="display ombre-titre mt-4 text-[clamp(2.6rem,8vw,6.5rem)]">{paid ? "Merci." : "Presque là."}</h1>
            <p className="mt-6 max-w-md text-lg text-doux">
              {paid ? <>Paiement confirmé. La confirmation arrive{email ? <> à <strong className="text-clair">{email}</strong></> : null}. Expédition sous 24 h ouvrées.</> : "Le paiement est en cours de confirmation. Vous recevrez un e-mail dès qu'il sera validé."}
            </p>
            <Link href="/" className="label mt-10 inline-block underline decoration-rose decoration-2 underline-offset-[6px] hover:text-rose">Retour à l&apos;accueil</Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
