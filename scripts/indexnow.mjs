/**
 * Envoie toutes les adresses du sitemap à IndexNow (Bing, Yandex, Seznam, Naver…), à faire une fois à la mise en
 * ligne puis après un gros changement. Les changements de prix et de fiche faits dans l'admin partent tout seuls.
 *   npm run seo:indexnow -- https://scult.eu
 */
const origin = (process.argv[2] ?? "").replace(/\/$/, "");
if (!/^https:\/\//.test(origin)) { console.error("Usage : npm run seo:indexnow -- https://scult.eu"); process.exit(1); }
const xml = await (await fetch(`${origin}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.startsWith(origin) && !/\.(webp|avif|jpe?g|png)$/.test(u));
const robots = await (await fetch(`${origin}/robots.txt`)).text();
const found = (await (await fetch(origin)).text()).match(/name="indexnow-key" content="([a-f0-9]{8,128})"/)?.[1];
if (/Disallow: \/\s*$/m.test(robots) && !/Allow: \//.test(robots)) { console.error("✗ ce site interdit l'indexation (robots.txt) : rien n'est envoyé."); process.exit(1); }
if (!found) { console.error("✗ clé IndexNow introuvable sur la page d'accueil."); process.exit(1); }
const res = await fetch("https://api.indexnow.org/indexnow", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ host: new URL(origin).host, key: found, keyLocation: `${origin}/${found}.txt`, urlList: urls }) });
console.log(`${res.status === 200 || res.status === 202 ? "✓" : "✗"} ${urls.length} adresses envoyées à IndexNow (réponse ${res.status})`);
