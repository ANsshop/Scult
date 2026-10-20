import Link from "next/link";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <>
      <Header />
      <main><Container className="py-24 md:py-36"><p className="label text-stone">404</p><h1 className="display mt-4 text-[clamp(2.6rem,8vw,6.5rem)]">Rien ici.</h1><Link href="/" className="label mt-8 inline-block underline underline-offset-4">Retour à l&apos;accueil</Link></Container></main>
      <Footer />
    </>
  );
}
