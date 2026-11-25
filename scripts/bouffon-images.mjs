/**
 * Visuels de la DA « bouffon » : télécharge les sources (curl), les convertit
 * en AVIF + WebP à plusieurs largeurs dans public/bouffon/, pose les vues
 * détourées du pot sur fond blanc, et écrit le manifeste lu par le site
 * (src/lib/content/bouffon-images.json : dimensions et largeurs disponibles).
 *
 *   npm run images:bouffon
 *
 * Les sources (PNG de 4 à 7 Mo) ne sont pas versionnées : elles sont gardées
 * dans .bouffon-src/ et re-téléchargées si elles manquent. Un lien qui ne
 * répond plus arrête le script : on ne remplace jamais un visuel par autre chose.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3J6E8FvQ7RszPSiv0lUIbeL10Jq";
const SRC = ".bouffon-src";
const OUT = "public/bouffon";
const MANIFEST = "src/lib/content/bouffon-images.json";

/** nom → fichier source et largeurs produites (jamais plus large que la source). */
const IMAGES = {
  "hero-rose-desktop": { file: "hf_20261125_105536_6c39dcac-2b3d-4334-ae4f-8ee310bdb12e.png", widths: [960, 1440, 1920, 2688] },
  "hero-rose-mobile": { file: "hf_20261125_111007_04cc17cd-ac63-46f8-b005-8d2d70d732fb.png", widths: [480, 780, 1170] },
  // Refaite le 2026-11-25 sur Higgsfield, comme la version mobile, à partir de l'image d'origine (hf_20261125_110717_3ae8150c-…) :
  // le pot poussé vers l'objectif à deux mains, le bouffon à droite, la moitié gauche dans le noir pour le texte.
  "hero-dark-desktop": { file: "hf_20261125_162853_f15fcaa7-b94f-4137-bdec-47b81ae83db7.png", widths: [960, 1440, 1920, 2688] },
  // Refaite le 2026-11-25 sur Higgsfield à partir de l'affiche d'origine (hf_20261125_110717_0e6ecaeb-…) : le pot
  // poussé vers l'objectif, et un cadrage fait pour le téléphone — du noir en haut pour le titre, en bas pour le bouton.
  "hero-dark-mobile": { file: "hf_20261125_151524_27029277-a3b2-4e39-85e2-ff62ebc457cb.png", widths: [480, 780, 1170] },
  "hero-produit-desktop": { file: "hf_20261125_110718_d7afe922-a9d4-4f78-abf3-e0c5ffff68c6.png", widths: [780, 1440, 1920, 2688] },
  // La planche des sept vues du pot, sur fond gris : seul son gros plan est publié (DETAIL), le reste passe par BLANC.
  "pot-vues": { file: "hf_20261125_110716_87ef88da-577f-4619-8d2f-c4ced792a3fe.png", widths: [] },
  "bouffon-face": { file: "hf_20261124_211831_7a9d9a94-9fbc-4c83-877d-2edd84efc413.png", widths: [480, 800, 1200, 1792] },
  "bouffon-applaudit": { file: "hf_20261124_211828_c2cae7e6-464b-4dbd-ad49-57ebb026a115.png", widths: [480, 800, 1200, 1792] },
  // La deuxième slide du hero, l'annonce des pochons de caféine : le bouffon tend la boîte blanche. Générées le
  // 2026-11-25 sur Higgsfield (GPT Image 2.6) à partir des affiches du bouffon ci-dessus et de la feuille de
  // référence du produit, validée (docs/refonte-bouffon/sources/planche-pochons.jpg).
  "hero-poches-desktop": { file: "hf_20261125_193154_0d89db6a-756a-440f-96df-f47c470cba23.png", widths: [960, 1440, 1920, 2688] },
  "hero-poches-mobile": { file: "hf_20261125_193157_364dd60b-9c59-41c3-90fb-2ca0956c1f6d.png", widths: [480, 780, 1170] },
  // Fournie en fichier le 2026-11-25 (pas de lien) : la source est versionnée.
  "slide-pots": { local: "docs/refonte-bouffon/sources/slide-pots.jpg", widths: [960, 1440, 1920] },
};

/**
 * Les photos du pot sur fond blanc (galerie de la fiche produit, catalogue).
 * Les photos d'origine sont sur fond gris — le packshot
 * (hf_20261125_110545_d4a67113-…) et les vues de la planche pot-vues. Leur fond
 * a été retiré sur Higgsfield le 2026-11-25 (`cut` : le fichier détouré) ; ici
 * on pose chaque pot sur un blanc 4:5, sans jamais le déformer : la photo est
 * réduite d'un bloc, toujours à la même échelle (`height` : la hauteur du pot
 * dans le cadre), avec une ombre de contact. Les vues viennent d'une planche
 * de 2688 px : elles sont trois fois plus petites que le packshot, d'où leur
 * cadre plus petit.
 */
const GRAND = [1600, 2000], PETIT = [880, 1100];
const BLANC = {
  "pot-blanc-face": { cut: "hf_20261125_152816_fbf256d6-1686-4957-962b-9064f3f833bd.png", canvas: GRAND, height: 0.74, widths: [400, 800, 1200, 1600] },
  "pot-blanc-trois-quarts": { cut: "hf_20261125_153026_694d8c70-39a3-46d1-a2e8-2700a8f59821.png", canvas: PETIT, height: 0.74, widths: [440, 880] },
  "pot-blanc-profil": { cut: "hf_20261125_153029_58268625-9d39-4f3d-a518-e077c77a1a0b.png", canvas: PETIT, height: 0.74, widths: [440, 880] },
  "pot-blanc-dos": { cut: "hf_20261125_153032_a4ccbf71-95d3-4608-b208-e0909942c947.png", canvas: PETIT, height: 0.74, widths: [440, 880] },
  // Le couvercle vu de dessus : au milieu du cadre, à la largeur du pot debout.
  "pot-blanc-couvercle": { cut: "hf_20261125_153038_6adbfe08-42e7-4e69-b766-e2d41a285065.png", canvas: PETIT, height: 0.56, centre: true, widths: [440, 880] },
  // Le pot ouvert et son couvercle posé à côté : le pot, sans couvercle, est un peu moins haut.
  "pot-blanc-ouvert": { cut: "hf_20261125_153041_50a833cd-3c62-4dbd-ace6-21b496f0ab74.png", canvas: PETIT, height: 0.68, widths: [440, 880] },
};
/** Le pot détouré, sans fond : les vignettes du panier et l'animation d'ajout au panier. */
const DETOURE = { name: "pot-detoure", from: "pot-blanc-face", widths: [200, 400] };
/** Le gros plan de la planche pot-vues, recadré en 4:5 sur le cœur N°001 et le début du nom (aucun fond gris dans ce cadre). */
const DETAIL = { name: "pot-blanc-detail", box: { left: 760, top: 775, width: 588, height: 735 }, widths: [400, 588] };

mkdirSync(SRC, { recursive: true });
mkdirSync(OUT, { recursive: true });

function fetchSource(name, file) {
  const path = join(SRC, `${name}.png`);
  if (existsSync(path) && statSync(path).size > 100_000) return path;
  console.log(`↓ ${name}`);
  try {
    execFileSync("curl", ["-fsSL", "--max-time", "120", "-o", path, `${CDN}/${file}`], { stdio: "inherit" });
  } catch {
    console.error(`✗ ${name} : le lien ne répond plus (${CDN}/${file}). Arrêt.`);
    process.exit(1);
  }
  return path;
}

const manifest = {};


async function emit(name, pipeline, widths, sourceWidth, sourceHeight) {
  const kept = widths.filter((w) => w <= sourceWidth);
  for (const w of kept) {
    const base = join(OUT, `${name}-${w}`);
    await pipeline().resize({ width: w }).avif({ quality: 50, effort: 5 }).toFile(`${base}.avif`);
    await pipeline().resize({ width: w }).webp({ quality: 78, effort: 5 }).toFile(`${base}.webp`);
    const ko = (f) => (statSync(f).size / 1024).toFixed(0);
    console.log(`  ${name}-${w}  avif ${ko(`${base}.avif`)} Ko · webp ${ko(`${base}.webp`)} Ko`);
  }
  manifest[name] = { width: sourceWidth, height: sourceHeight, widths: kept };
}

for (const [name, { file, local, widths }] of Object.entries(IMAGES)) {
  const path = local ?? fetchSource(name, file);
  const meta = await sharp(path).metadata();
  if (name === "pot-vues") {
    await emit(DETAIL.name, () => sharp(path).extract(DETAIL.box), DETAIL.widths, DETAIL.box.width, DETAIL.box.height);
    continue;
  }
  await emit(name, () => sharp(path), widths, meta.width, meta.height);
}

// Les pots sur fond blanc.
for (const [name, { cut, canvas: [W, H], height, centre = false, widths }] of Object.entries(BLANC)) {
  const path = fetchSource(name.replace("pot-blanc-", "detoure-"), cut);
  // Le pot seul : on retire le vide autour, puis on le réduit d'un bloc (largeur et hauteur ensemble).
  const pot = await sharp(path).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const h = Math.round(H * height);
  const w = Math.round((h * pot.info.width) / pot.info.height);
  if (w > W * 0.94) { console.error(`✗ ${name} : le pot déborde du cadre (${w} px pour ${W}).`); process.exit(1); }
  const left = Math.round((W - w) / 2);
  const bottom = centre ? Math.round((H + h) / 2) : Math.round(H * 0.885);
  const resized = await sharp(pot.data).resize(w, h).png().toBuffer();
  // L'ombre de contact : une ellipse serrée sous le pot, une plus large et plus pâle autour.
  const ellipse = (rx, ry, opacity, blur) =>
    sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><ellipse cx="${W / 2}" cy="${bottom - ry * 0.4}" rx="${rx}" ry="${ry}" fill="#000" fill-opacity="${opacity}"/></svg>`)).blur(blur).png().toBuffer();
  const layers = [
    { input: await ellipse(w * 0.62, H * 0.034, 0.16, H * 0.028), left: 0, top: 0 },
    { input: await ellipse(w * 0.47, H * 0.016, 0.5, H * 0.009), left: 0, top: 0 },
    { input: resized, left, top: bottom - h },
  ];
  const flat = await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } }).composite(layers).png().toBuffer();
  await emit(name, () => sharp(flat), widths, W, H);
  if (name === DETOURE.from) await emit(DETOURE.name, () => sharp(pot.data), DETOURE.widths, pot.info.width, pot.info.height);
}

// Image de partage (Open Graph / Twitter) : le hero dark, recadré en 1200 × 630.
const og = await sharp(join(SRC, "hero-dark-desktop.png")).resize(1200, 630, { fit: "cover", position: "right" }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
writeFileSync("src/app/opengraph-image.jpg", og);
writeFileSync("src/app/twitter-image.jpg", og);

writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`✓ ${Object.keys(manifest).length} visuels dans ${OUT}, manifeste : ${MANIFEST}`);
