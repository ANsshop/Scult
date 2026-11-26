import Link from "next/link";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/ui/Container";
import { Picture } from "@/components/site/Picture";
import { NOT_FOUND } from "@/lib/content/site";

export default function NotFound() {
  return (
    <>
      <Header />
      <main>
        <Container className="grid items-center gap-10 py-16 md:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] md:gap-16 md:py-24">
          <Picture name="bouffon-face" alt={NOT_FOUND.alt} sizes="(min-width: 768px) 36vw, 100vw" priority className="mx-auto block h-auto w-full max-w-sm md:max-w-none" />
          <div>
            <p className="label text-rose">404</p>
            <h1 className="display ombre-titre mt-4 text-[clamp(3rem,9vw,7.5rem)]">{NOT_FOUND.title}</h1>
            <p className="mt-6 text-lg text-doux">{NOT_FOUND.text}</p>
            <Link href="/" className="label mt-10 inline-block underline decoration-rose decoration-2 underline-offset-[6px] hover:text-rose">{NOT_FOUND.link}</Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
