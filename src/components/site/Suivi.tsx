"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SID = "scult_sid";
const SOURCE = "scult_source";
const SENT = "scult_suivi";

/** D'où vient la visite : `utm_source` s'il y en a un, sinon le site d'où on arrive, sinon « direct ». */
function source(): string {
  const utm = new URLSearchParams(window.location.search).get("utm_source");
  let host = "";
  try { host = document.referrer ? new URL(document.referrer).hostname : ""; } catch { /* référent illisible */ }
  const raw = utm || (host && host !== window.location.hostname ? host.replace(/^(www|m|l|lm)\./, "").split(".").slice(-2, -1)[0] ?? host : "direct");
  return raw.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40) || "direct";
}

/**
 * La mesure d'audience, pour le taux de conversion de l'admin : une visite par
 * onglet, les fiches produit vues, le premier ajout au panier.
 *
 * Sans cookie et sans donnée personnelle : l'identifiant est tiré au hasard,
 * vit dans l'onglet (sessionStorage) et disparaît à sa fermeture. Rien n'est
 * envoyé si le navigateur demande à ne pas être suivi, ni depuis l'admin.
 *
 * L'ajout au panier se lit sur la pastille du panier (`data-cart-badge`) : son
 * chiffre monte juste après un geste du visiteur. Le panier lui-même n'est pas
 * modifié pour ça.
 */
export function Suivi() {
  const path = usePathname();

  useEffect(() => {
    if (path.startsWith("/admin")) return;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl || nav.webdriver) return;
    let sid: string, from: string, sent: string[];
    try {
      sid = sessionStorage.getItem(SID) ?? crypto.randomUUID();
      from = sessionStorage.getItem(SOURCE) ?? source();
      sent = JSON.parse(sessionStorage.getItem(SENT) ?? "[]");
      sessionStorage.setItem(SID, sid);
      sessionStorage.setItem(SOURCE, from);
    } catch {
      return; // stockage bloqué : pas de mesure
    }
    const send = (type: "visit" | "product_view" | "add_to_cart", key: string) => {
      if (sent.includes(key)) return;
      sent.push(key);
      try { sessionStorage.setItem(SENT, JSON.stringify(sent)); } catch { /* tant pis */ }
      const body = JSON.stringify({ type, sid, path, source: from, device: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop" });
      fetch("/api/suivi", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    };
    send("visit", "visit");
    if (path.startsWith("/produits/")) send("product_view", `vue:${path}`);

    // L'ajout au panier : la pastille du panier monte dans les secondes qui suivent un clic ou une touche.
    const count = () => Number([...document.querySelectorAll<HTMLElement>("[data-cart-badge]")].find((el) => el.offsetParent !== null)?.textContent?.replace(/\D/g, "") || 0);
    let last = -1;
    let gesture = 0;
    const settle = window.setTimeout(() => { last = count(); }, 1500); // le panier enregistré se recharge à l'arrivée : ce n'est pas un ajout
    const onGesture = () => { gesture = Date.now(); };
    const observer = new MutationObserver(() => {
      if (last < 0) return;
      const now = count();
      if (now > last && Date.now() - gesture < 4000) send("add_to_cart", "panier");
      last = now;
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    window.addEventListener("pointerdown", onGesture, { passive: true });
    window.addEventListener("keydown", onGesture, { passive: true });
    return () => {
      window.clearTimeout(settle);
      observer.disconnect();
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, [path]);

  return null;
}
