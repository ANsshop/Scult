"use client";

import { useEffect, useState } from "react";

/** L'intro est-elle en cours ? (états de <html data-intro>, voir script.ts) */
const playing = () => ["play", "glitch", "fade"].includes(document.documentElement.dataset.intro ?? "");

/**
 * La coquille de la couche rose : fixe, plein écran, au-dessus de tout, hors
 * du flux (son retrait ne déplace rien). Décorative : `aria-hidden`, `inert`,
 * `data-nosnippet`.
 *
 * Son contenu n'appartient pas à React : c'est le script inline qui l'écrit et
 * le retire (`dangerouslySetInnerHTML` vide + `suppressHydrationWarning` :
 * React n'y touche pas à l'hydratation). Une fois l'intro finie — ou si elle
 * ne joue pas — la coquille elle-même quitte le DOM.
 */
export function IntroShell() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const check = () => { if (!playing()) setGone(true); };
    check();
    window.addEventListener("scult:intro-fin", check);
    return () => window.removeEventListener("scult:intro-fin", check);
  }, []);

  if (gone) return null;
  return <div id="intro-rose" aria-hidden="true" inert data-nosnippet suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />;
}
