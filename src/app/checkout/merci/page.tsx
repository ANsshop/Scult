import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/ui/Container";
import { ClearCartOnMount } from "@/components/cart/ClearCartOnMount";
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
        <Container className="py-20 md:py-28">
          <p className="label text-ruby">Commande</p>
          <h1 className="display mt-4 text-[clamp(2.6rem,8vw,6.5rem)]">{paid ? "Merci." : "Presque là."}</h1>
          <p className="mt-6 max-w-md text-lg text-stone">
            {paid ? <>Paiement confirmé. La confirmation arrive{email ? <> à <strong className="text-ink">{email}</strong></> : null}. Expédition sous 24 h ouvrées.</> : "Le paiement est en cours de confirmation. Vous recevrez un e-mail dès qu'il sera validé."}
          </p>
          <Link href="/" className="label mt-10 inline-block underline underline-offset-4">Retour à l&apos;accueil</Link>
        </Container>
      </main>
      <Footer />
    </>
  );
}
