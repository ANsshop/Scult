/**
 * Le contrôle du référencement : ce qu'un moteur lit sur le site (balises, données structurées, robots.txt, sitemap,
 * flux Merchant Center, IndexNow, pages de fond).
 *   npm run test:seo -- http://localhost:3010
 * Le site doit tourner en mode indexable, à la même adresse : SITE_INDEXABLE=1 NEXT_PUBLIC_SITE_URL=http://localhost:3010
 * au build et au lancement. Lecture seule : peut aussi viser le site en ligne.
 */
const base = process.argv[2];
let bad = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`); if (!ok) bad++; };
const get = async (p) => { const r = await fetch(base + p, { headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } }); return { status: r.status, text: await r.text(), type: r.headers.get("content-type") ?? "" }; };
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
const meta = (html, name) => html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]*)"`))?.[1] ?? null;
const title = (html) => html.match(/<title>(.*?)<\/title>/s)?.[1];
const h1 = (html) => [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gs)].map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

const home = await get("/");
const org = ld(home.text).flatMap((d) => d["@graph"] ?? [d]);
const store = org.find((n) => n["@type"] === "OnlineStore");
check("accueil : indexable, grandes images autorisées", (meta(home.text, "robots") ?? "").includes("index") && (meta(home.text, "googlebot") ?? "").includes("max-image-preview:large"), `${meta(home.text, "robots")} | ${meta(home.text, "googlebot")}`);
check("accueil : boutique (OnlineStore) avec retours et livraison", store?.hasMerchantReturnPolicy?.merchantReturnDays === 14 && store.hasMerchantReturnPolicy.returnFees.endsWith("ReturnFeesCustomerResponsibility") && store.hasShippingService?.shippingConditions?.length === 6);
const fr = store.hasShippingService.shippingConditions.filter((c) => c.shippingDestination.some((d) => d.addressCountry === "FR"));
check("livraison France : 5,90 € sous 60 €, offerte dès 60 €, 2 à 4 jours", fr.length === 2 && fr[0].shippingRate.value === 5.9 && fr[0].orderValue.maxValue === 59.99 && fr[1].shippingRate.value === 0 && fr[1].orderValue.minValue === 60 && fr[0].transitTime.duration.maxValue === 4);
check("accueil : nom du site (WebSite)", org.some((n) => n["@type"] === "WebSite" && n.name === "SCULT"));
check("accueil : un seul h1", h1(home.text).length === 1, h1(home.text).join(" | "));

const prod = await get("/produits/cri");
const p = ld(prod.text).find((d) => d["@type"] === "Product");
check("fiche : titre et description écrits pour la recherche", title(prod.text)?.startsWith("Pré-workout CRI") && (meta(prod.text, "description") ?? "").includes("pré-workout"), title(prod.text));
check("fiche : le h1 porte le nom et ce que c'est", h1(prod.text).length === 1 && /CRI.*pré-workout/i.test(h1(prod.text)[0]), h1(prod.text)[0]);
check("fiche : lien canonique", prod.text.includes(`<link rel="canonical" href="${base}/produits/cri"`));
check("fiche : Product avec prix, devise, stock, état, référence, marque", p?.offers?.price === 49 && p.offers.priceCurrency === "EUR" && p.offers.availability.endsWith("InStock") && p.sku === "SCULT-CRI-690-FP" && p.mpn === p.sku && p.brand.name === "SCULT");
check("fiche : prix au kilo (0,69 kg rapporté à 1 kg)", p.offers.priceSpecification?.referenceQuantity?.value === "0.69" && p.offers.priceSpecification.referenceQuantity.valueReference.unitCode === "KGM");
check("fiche : le prix au kilo et à la dose est écrit sur la page", prod.text.includes("71,01") && prod.text.includes("le kilo") && prod.text.includes("1,63"));
check("fiche : ni note ni avis inventés", !("aggregateRating" in p) && !("review" in p));
const imgs = await Promise.all(p.image.map(async (u) => (await fetch(u)).status));
check("fiche : images nommées avec le mot-clé, en WebP, toutes servies", p.image.length >= 3 && p.image.every((u) => /pre-workout-scult-cri-[a-z-]+-\d+\.webp$/.test(u)) && imgs.every((s) => s === 200), p.image[0].split("/").pop());
check("fiche : la composition est dans le HTML servi (lisible sans JavaScript)", prod.text.includes("L-citrulline") && prod.text.includes("8 000 mg") && prod.text.includes("Bêta-alanine"));
check("fiche : image de partage = la photo du produit, 1200 px", (meta(prod.text, "og:image") ?? "").includes("pre-workout-scult-cri-face-1200") && meta(prod.text, "og:image:width") === "1200");

const guide = await get("/guide/pre-workout");
const art = ld(guide.text);
check("guide : 200, un h1, Article daté, questions, fil d'Ariane", guide.status === 200 && h1(guide.text).length === 1 && art.some((d) => d["@type"] === "Article" && d.dateModified) && art.some((d) => d["@type"] === "FAQPage") && art.some((d) => d["@type"] === "BreadcrumbList"), title(guide.text));
check("guide : sources citées et liens vers les cinq ingrédients", guide.text.includes("efsa.europa.eu") && ["citrulline", "beta-alanine", "creatine", "cafeine", "l-theanine"].every((s) => guide.text.includes(`/ingredients/${s}`)));
for (const s of ["citrulline", "beta-alanine", "creatine", "cafeine", "l-theanine"]) {
  const r = await get(`/ingredients/${s}`);
  check(`ingrédient ${s} : 200, un h1, canonique`, r.status === 200 && h1(r.text).length === 1 && r.text.includes(`<link rel="canonical" href="${base}/ingredients/${s}"`), title(r.text));
}
check("ingrédient inconnu : vraie 404", (await get("/ingredients/nexiste-pas")).status === 404);

const robots = (await get("/robots.txt")).text;
check("robots.txt : moteurs de réponse nommés, zones privées fermées, sitemap", ["OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "bingbot", "MistralAI-Index"].every((b) => robots.includes(`User-Agent: ${b}`)) && robots.includes("Disallow: /admin") && robots.includes(`Sitemap: ${base}/sitemap.xml`));
const sm = (await get("/sitemap.xml")).text;
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check("sitemap : accueil, fiche, guide, 5 ingrédients, pages d'aide ; ni admin ni pochons", locs.includes(`${base}/guide/pre-workout`) && locs.filter((l) => l.includes("/ingredients/")).length === 5 && !sm.includes("/admin") && !sm.includes("pochons") && !sm.includes("<priority>") && !sm.includes("<changefreq>"), `${locs.length} adresses`);
check("sitemap : images de la fiche produit déclarées", (sm.match(/<image:loc>/g) ?? []).length >= 3 && sm.includes("pre-workout-scult-cri-face"));
const statuses = await Promise.all(locs.map(async (l) => (await fetch(l)).status));
check("sitemap : toutes les adresses répondent 200", statuses.every((s) => s === 200), statuses.filter((s) => s !== 200).join(","));
const feed = await get("/feeds/google.xml");
check("flux Merchant Center : deux articles, prix, marque, référence, prix au kilo, pack déclaré", feed.type.includes("xml") && (feed.text.match(/<item>/g) ?? []).length === 2 && feed.text.includes("<g:price>49.00 EUR</g:price>") && feed.text.includes("<g:sale_price>83.30 EUR</g:sale_price>") && feed.text.includes("<g:unit_pricing_measure>690 g") && feed.text.includes("<g:multipack>2") && feed.text.includes("<g:mpn>SCULT-CRI-690-FP</g:mpn>") && !feed.text.includes(".avif"));
const key = meta(home.text, "indexnow-key");
check("IndexNow : la clé de l'accueil correspond au fichier servi", Boolean(key) && (await get(`/${key}.txt`)).text.trim() === key);
check("pochons et admin : hors index", (meta((await get("/produits/pochons")).text, "robots") ?? "").includes("noindex") && (meta((await get("/admin/connexion")).text, "robots") ?? "").includes("noindex"));
console.log(bad ? `\n${bad} ÉCHEC(S)` : "\nTout passe.");
process.exit(bad ? 1 : 0);
