"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: "M2.5 13.5v-6l5.5-5 5.5 5v6h-3.5v-4h-4v4z" },
  { href: "/admin/commandes", label: "Commandes", icon: "M2 5l6-3 6 3v6l-6 3-6-3V5zM2 5l6 3 6-3M8 8v6", badge: true },
  { href: "/admin/produits", label: "Produits et stock", icon: "M3 3h10v10H3zM3 6.5h10M6.5 3v10" },
  { href: "/admin/clients", label: "Clients", icon: "M8 8a2.7 2.7 0 100-5.4A2.7 2.7 0 008 8zM2.8 13.5c.6-2.4 2.6-3.7 5.2-3.7s4.6 1.3 5.2 3.7" },
  { href: "/admin/promos", label: "Codes promo", icon: "M2.5 8.2V2.5h5.7l5.3 5.3-5.7 5.7zM5.3 5.3h.01" },
  { href: "/admin/reglages", label: "Réglages", icon: "M2.5 4.5h7M12.5 4.5h1M2.5 11.5h1M6.5 11.5h7M11 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM5 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" },
];

/**
 * L'habillage de l'admin : le menu noir à gauche (six entrées, pas vingt-cinq),
 * le contenu à droite. Sur téléphone, le menu se replie derrière un bouton.
 * `pending` : ce qui attend d'être préparé ou expédié, en pastille sur « Commandes ».
 */
export function Shell({ admin, pending, children }: { admin: { name: string; email: string }; pending: number; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- le menu se referme quand on change de page
  useEffect(() => setOpen(false), [path]);
  const isOn = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <div className="admin flex min-h-screen w-full flex-col bg-[#f4f3f0] lg:flex-row">
      <aside className="sombre z-30 shrink-0 bg-fond lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[15.5rem] lg:flex-col">
        <div className="flex h-14 items-center justify-between px-5 lg:h-auto lg:px-6 lg:pb-6 lg:pt-7">
          <Link href="/admin" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- un fichier fixe, déjà à la bonne taille */}
            <img src="/brand/sourire-chrome-480.webp" alt="" width={480} height={193} className="h-5 w-auto" />
            <span className="display text-[1.05rem] tracking-normal">Scult</span>
            <span className="label rounded-full border border-texte/25 px-2 py-0.5 !text-[0.5625rem] text-doux">Admin</span>
          </Link>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="menu-admin" className="label flex h-9 items-center rounded-full border border-texte/30 px-3.5 lg:hidden">{open ? "Fermer" : "Menu"}</button>
        </div>
        <nav id="menu-admin" aria-label="Admin" className={`${open ? "block" : "hidden"} border-t px-3 pb-4 pt-3 lg:block lg:flex-1 lg:border-t-0 lg:pt-0`}>
          <ul className="space-y-0.5">
            {NAV.map((n) => {
              const on = isOn(n.href);
              return (
                <li key={n.href}>
                  <Link href={n.href} aria-current={on ? "page" : undefined} className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[0.875rem] transition-colors ${on ? "bg-white/12 font-semibold text-texte" : "text-doux hover:bg-white/6 hover:text-texte"}`}>
                    <svg aria-hidden viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={on ? "text-rose" : ""}><path d={n.icon} /></svg>
                    <span className="flex-1">{n.label}</span>
                    {n.badge && pending > 0 && <span className="rounded-full bg-rose px-1.5 py-px text-[0.72rem] font-bold tabular-nums text-noir" aria-label={`${pending} à traiter`}>{pending}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={`${open ? "block" : "hidden"} border-t px-5 py-4 lg:block`}>
          <p className="truncate text-[0.85rem] font-medium">{admin.name}</p>
          <p className="truncate text-[0.76rem] text-discret">{admin.email}</p>
          <div className="mt-3 flex items-center gap-4 text-[0.8rem]">
            <Link href="/" className="text-doux underline-offset-4 hover:text-texte hover:underline">Voir la boutique</Link>
            <form action={logoutAction}><button type="submit" className="cursor-pointer text-doux underline-offset-4 hover:text-texte hover:underline">Se déconnecter</button></form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-9 xl:px-12">
        <div className="mx-auto w-full max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
