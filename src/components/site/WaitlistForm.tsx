"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { joinWaitlistAction, type WaitlistState } from "@/lib/waitlist/actions";

/**
 * Le formulaire de la liste d'attente : une adresse e-mail, un bouton. Avant
 * la sortie, il tient la place du bloc d'achat sur la fiche produit.
 *
 * Avec l'adresse part la provenance de la visite (celle de la mesure
 * d'audience, Suivi.tsx : « tiktok », « instagram », « direct »…) : l'admin
 * dit ainsi d'où viennent les inscrits. `site` est un piège à robots : un
 * champ invisible, qu'un visiteur ne remplit jamais.
 */
export function WaitlistForm({ when, className = "" }: { when: string; className?: string }) {
  const [state, action, pending] = useActionState<WaitlistState, FormData>(joinWaitlistAction, null);
  const [from, setFrom] = useState({ source: "", device: "" });

  useEffect(() => {
    let source = "";
    try { source = sessionStorage.getItem("scult_source") ?? ""; } catch { /* stockage bloqué */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture one-shot du navigateur
    setFrom({ source, device: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop" });
  }, []);

  if (state?.ok) {
    return (
      <p role="status" className={`rounded-card border border-rose bg-white px-5 py-4 ${className}`}>
        <strong className="display block text-[1.35rem] leading-none">Tu es sur la liste.</strong>
        <span className="mt-2 block text-[0.95rem] text-doux">{state.message}</span>
      </p>
    );
  }
  return (
    <form action={action} className={className} noValidate>
      <label htmlFor="liste-email" className="label text-discret">Ton e-mail, pour être prévenu à la sortie</label>
      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
        <input id="liste-email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="toi@exemple.fr" aria-describedby="liste-note liste-etat" className="input h-14 w-full min-w-0 shrink-0 bg-white px-4 text-[1rem] sm:w-auto sm:flex-1 sm:shrink" />
        <Button type="submit" disabled={pending} className="!h-14 shrink-0 sm:px-8">{pending ? "Un instant…" : "Préviens-moi"}</Button>
      </div>
      <input type="hidden" name="source" value={from.source} />
      <input type="hidden" name="device" value={from.device} />
      {/* Piège à robots : hors de l'écran, hors de la tabulation, ignoré des lecteurs d'écran */}
      <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[200vw] h-0 w-0 opacity-0" />
      <p id="liste-etat" role="alert" className="mt-2 min-h-5 text-sm text-rose">{state && !state.ok ? state.message : ""}</p>
      <p id="liste-note" className="text-[0.8rem] leading-relaxed text-discret">
        Un seul e-mail, le jour de la sortie ({when}). Ton adresse ne sert à rien d&apos;autre. <Link href="/confidentialite" className="underline underline-offset-4 hover:text-rose">Confidentialité</Link>
      </p>
    </form>
  );
}
