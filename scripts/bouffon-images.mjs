/**
 * Visuels de la DA « bouffon » : télécharge les sources (curl), les convertit
 * en AVIF + WebP à plusieurs largeurs dans public/bouffon/, découpe la planche
 * multi-vues du pot, et écrit le manifeste lu par le site
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
  "hero-dark-desktop": { file: "hf_20261125_110717_3ae8150c-9161-474b-9ba8-40b36093cdc3.png", widths: [960, 1440, 1920, 2688] },
  // Refaite le 2026-11-25 sur Higgsfield à partir de l'affiche d'origine (hf_20261125_110717_0e6ecaeb-…) : le pot
  // poussé vers l'objectif, et un cadrage fait pour le téléphone — du noir en haut pour le titre, en bas pour le bouton.
  "hero-dark-mobile": { file: "hf_20261125_151524_27029277-a3b2-4e39-85e2-ff62ebc457cb.png", widths: [480, 780, 1170] },
  "hero-produit-desktop": { file: "hf_20261125_110718_d7afe922-a9d4-4f78-abf3-e0c5ffff68c6.png", widths: [780, 1440, 1920, 2688] },
  "pot-packshot": { file: "hf_20261125_110545_d4a67113-9e74-4b71-b7c3-3448700349e7.png", widths: [400, 800, 1200, 1792] },
  "pot-vues": { file: "hf_20261125_110716_87ef88da-577f-4619-8d2f-c4ced792a3fe.png", widths: [] },
  "bouffon-face": { file: "hf_20261124_211831_7a9d9a94-9fbc-4c83-877d-2edd84efc413.png", widths: [480, 800, 1200, 1792] },
  "bouffon-applaudit": { file: "hf_20261124_211828_c2cae7e6-464b-4dbd-ad49-57ebb026a115.png", widths: [480, 800, 1200, 1792] },
  // La deuxième slide du hero, « −30 % sur le deuxième pot » : générée le 2026-11-25 sur Higgsfield
  // (GPT Image 2.6), avec le visuel slide-pots pour le style et pot-packshot pour l'étiquette.
  "hero-offre-desktop": { file: "hf_20261125_140920_4d6ec21b-2ca3-44e0-b7c9-bea660bb722a.png", widths: [960, 1440, 1920, 2688] },
  "hero-offre-mobile": { file: "hf_20261125_141250_cd3e1de0-d7c5-491a-9bad-e72b9c38c615.png", widths: [480, 780, 1170] },
  // Fournie en fichier le 2026-11-25 (pas de lien) : la source est versionnée.
  "slide-pots": { local: "docs/refonte-bouffon/sources/slide-pots.jpg", widths: [960, 1440, 1920] },
};

/**
 * Les sept vues de la planche pot-vues (2688 × 1520) : quatre en haut, trois
 * en bas, séparées par des filets blancs. Les cadres sont rentrés de quelques
 * pixels pour ne garder aucun filet.
 */
const VUES = {
  "pot-vue-face": { left: 8, top: 8, width: 660, height: 754 },
  "pot-vue-trois-quarts": { left: 680, top: 8, width: 659, height: 754 },
  "pot-vue-profil": { left: 1351, top: 8, width: 660, height: 754 },
  "pot-vue-dos": { left: 2023, top: 8, width: 657, height: 754 },
  "pot-vue-couvercle": { left: 7, top: 775, width: 721, height: 735 },
  "pot-vue-detail": { left: 742, top: 775, width: 1073, height: 735 },
  "pot-vue-ouvert": { left: 1830, top: 775, width: 850, height: 735 },
};

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
    for (const [vue, box] of Object.entries(VUES)) {
      await emit(vue, () => sharp(path).extract(box), [400, box.width], box.width, box.height);
    }
    continue;
  }
  await emit(name, () => sharp(path), widths, meta.width, meta.height);
}

// Image de partage (Open Graph / Twitter) : le hero dark, recadré en 1200 × 630.
const og = await sharp(join(SRC, "hero-dark-desktop.png")).resize(1200, 630, { fit: "cover", position: "right" }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
writeFileSync("src/app/opengraph-image.jpg", og);
writeFileSync("src/app/twitter-image.jpg", og);

writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`✓ ${Object.keys(manifest).length} visuels dans ${OUT}, manifeste : ${MANIFEST}`);
