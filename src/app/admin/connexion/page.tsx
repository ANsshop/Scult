import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "../actions";
import { BTN_PRIMARY, Field, Flash, INPUT } from "@/components/admin/ui";
import { adminReady, currentAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  const ready = adminReady();
  if (ready && (await currentAdmin())) redirect("/admin");
  return (
    <main className="admin grid min-h-screen w-full lg:grid-cols-[1.1fr_1fr]">
      <div className="sombre flex flex-col justify-between bg-fond p-8 lg:p-14">
        <p className="label text-discret">Scult · Admin</p>
        <div className="py-10">
          {/* eslint-disable-next-line @next/next/no-img-element -- un fichier fixe */}
          <img src="/brand/sourire-chrome.webp" alt="" width={921} height={370} className="h-auto w-[min(60%,18rem)]" />
          <p className="display mt-8 text-[clamp(2.2rem,5vw,4.25rem)]">L&apos;envers<br /><span className="text-rose">du décor.</span></p>
        </div>
        <p className="text-[0.8rem] text-discret">Commandes, stock, clients, chiffres.</p>
      </div>
      <div className="flex items-center justify-center bg-[#f4f3f0] p-6 lg:p-14">
        <div className="w-full max-w-sm rounded-2xl border bg-white p-7">
          <h1 className="text-[1.25rem] font-semibold">Connexion</h1>
          {ready ? (
            <form action={loginAction} className="mt-6 space-y-4">
              <Flash erreur={erreur} />
              <Field label="E-mail"><input name="email" type="email" required autoComplete="username" autoFocus className={INPUT} /></Field>
              <Field label="Mot de passe"><input name="password" type="password" required autoComplete="current-password" className={INPUT} /></Field>
              <button type="submit" className={`${BTN_PRIMARY} mt-2 h-11 w-full`}>Entrer</button>
            </form>
          ) : (
            <div className="mt-4 space-y-3 text-[0.9rem] leading-relaxed text-doux">
              <p>L&apos;admin n&apos;est pas encore branché sur cette version du site : il lui manque sa base de données.</p>
              <p>Il faut renseigner <code className="rounded bg-[#f4f3f0] px-1.5 py-0.5 text-[0.8rem]">DATABASE_URL</code> et <code className="rounded bg-[#f4f3f0] px-1.5 py-0.5 text-[0.8rem]">ADMIN_SESSION_SECRET</code>, puis créer un compte avec <code className="rounded bg-[#f4f3f0] px-1.5 py-0.5 text-[0.8rem]">npm run db:admin</code>.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
