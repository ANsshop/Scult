import "server-only";
import { INDEXNOW_KEY, indexable, siteOrigin } from "@/lib/seo";

/**
 * IndexNow : avertit Bing (et Yandex, Seznam, Naver…) qu'une page vient de
 * changer, pour qu'ils la relisent tout de suite. C'est aussi par l'index de
 * Bing que Copilot — et en partie ChatGPT — trouvent le site. Google ne suit
 * pas ce protocole : pour lui, c'est le sitemap et Search Console.
 * Ne fait rien sur une adresse de démonstration, et ne fait jamais échouer l'appelant.
 */
export async function submitIndexNow(paths: string[]): Promise<void> {
  if (!indexable() || paths.length === 0) return;
  const origin = siteOrigin();
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(origin).host, key: INDEXNOW_KEY, keyLocation: `${origin}/${INDEXNOW_KEY}.txt`, urlList: paths.map((p) => `${origin}${p}`) }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    console.error("[indexnow]", e instanceof Error ? e.message : e);
  }
}
