/**
 * Compose l'étiquette du pot CRI, pour chaque goût.
 *
 * Même pot, même maquette : d'un goût à l'autre, seuls changent le nom du
 * goût, écrit dans sa couleur en face avant, et, au dos, la ligne « Saveur … »
 * et la liste d'ingrédients (arôme, colorant). Pour chaque goût, écrit dans
 * docs/3d/textures/ :
 *   wrap-<goût>.jpg  l'étiquette complète à enrouler sur le modèle 3D (4096 × 1652)
 *   dos-<goût>.jpg   le dos à plat (1500 × 2102)
 * et wrap.jpg, copie de l'étiquette du goût d'origine (celle que prend
 * build_pot.py par défaut).
 *
 *   node scripts/3d/gouts.mjs            # tous les goûts
 *   node scripts/3d/gouts.mjs ice-tea-peche
 *
 * La formule (tableau, ingrédients, mode d'emploi, précautions, ligne de
 * dosages de la face) est lue dans src/lib/content/cri-formule.json : le site
 * lit le même fichier, le pot et la fiche produit disent donc la même chose.
 *
 * Sources (docs/3d/sources/) : face.jpg (la face avant d'origine), dos.jpg
 * (le dos d'origine : on en garde l'en-tête et le pied), papier.jpg (le grain
 * du papier), les polices du dos.
 * Le rendu passe par Chrome sans interface.
 *
 * ⚠ Les listes d'ingrédients sont des estimations (ASSUMPTIONS.md) : elles se
 * remplacent par celles du fabricant, dans cri-formule.json.
 */
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { JBM, ecrire, file, lire, remplacerLigne, remplacerPastille, shoot } from "./retouche.mjs";

export { file, shoot };
export const SRC = resolve("docs/3d/sources");
const OUT = resolve("docs/3d/textures");
export const FORMULE = JSON.parse(readFileSync(resolve("src/lib/content/cri-formule.json"), "utf8"));

/** La ligne de dosages imprimée sur les visuels d'origine, et celle de la formule. */
export const LIGNE_ORIGINE = "CITRULLINE 8 G · BÊTA-ALANINE 4 G · CRÉATINE 3 G · CAFÉINE 150 MG";
export const LIGNE = FORMULE.ligneFace;

/**
 * Les goûts : nom, couleur, arôme et colorant sont dans cri-formule.json.
 * Sur le pot, le goût est simplement écrit dans sa couleur, sur deux lignes,
 * à gauche du filet des mentions (« 30 doses · 690 g ») : pas de cadre, pas de
 * photo.
 */
export const GOUTS = Object.entries(FORMULE.gouts).map(([slug, g]) => ({ slug, ...g, saveur: `Saveur ${g.nom.toLowerCase()}` }));

/**
 * Le marquage du goût, en SVG, dans le repère de l'ancienne pastille
 * (390 × 150, son bord droit à 34 px du filet) : deux lignes en JetBrains Mono
 * extra-gras, calées à droite, centrées sur la hauteur du filet.
 */
export function marque(g) {
  const taille = 68.5, cap = taille * 0.73, entre = taille * 0.52, haut = (150 - (2 * cap + entre)) / 2;
  const [l1, l2] = g.lignes.map((l) => l.toUpperCase());
  return `<g font-family="JBM" font-weight="800" font-size="${taille}" fill="${g.couleur}" text-anchor="end"><text x="388" y="${haut + cap}">${l1}</text><text x="388" y="${haut + 2 * cap + entre}">${l2}</text></g>`;
}
/**
 * Les mentions à droite du filet (« 30 doses · 690 g · complément
 * alimentaire »), dans le même repère que le marquage du goût. Elles sont
 * justes sur les photos d'origine ; elles servent à les réimprimer sur une
 * image générée où le pot est petit et ses petits textes illisibles.
 */
export const MENTIONS_ZONE = [446, -8, 690, 158];
export function mentions() {
  const lignes = [`${FORMULE.doses} DOSES`, FORMULE.poids.toUpperCase(), "COMPLÉMENT", "ALIMENTAIRE"], bases = [25, 62.6, 109.3, 146.7];
  return `<g font-family="JBM" font-weight="500" font-size="30" letter-spacing="1.3" fill="#141416">${lignes.map((l, i) => `<text x="455" y="${bases[i]}">${l}</text>`).join("")}</g>`;
}
/** La phrase du bord du couvercle, telle qu'on la voit de face : elle fait le tour, on en lit un peu plus de deux. */
export const COUVERCLE = "SILENCE. · RIEN NE SE SCULPTE EN SILENCE. · RIEN NE SE SCULPTE EN SILENCE. · RIEN NE";

/** Où était la pastille sur la face à plat, et le papier vierge juste dessous. */
const FACE_PASTILLE = { coins: [[2072, 1422], [2462, 1422], [2462, 1572], [2072, 1572]], papier: { y: 1582, h: 46 } };

/** La liste d'ingrédients du goût : la liste commune, avec son arôme et son colorant (cri-formule.json). */
export const ingredientsDe = (g) => FORMULE.ingredients.replace("{AROME}", FORMULE.gouts[g.slug].arome).replace("{COLORANT}", FORMULE.gouts[g.slug].colorant);

export const fonts = `
${JBM}
@font-face{font-family:Cousine;src:url('${file(join(SRC, "Cousine-Regular.ttf"))}');font-weight:400}
@font-face{font-family:Cousine;src:url('${file(join(SRC, "Cousine-Bold.ttf"))}');font-weight:700}
@font-face{font-family:Montserrat;src:url('${file(join(SRC, "Montserrat-ExtraBold.ttf"))}');font-weight:800}
html,body{margin:0;background:#000}`;

/** Un nom à trait d'union (« L-théanine ») ne se coupe pas en fin de ligne. */
const insecable = (t) => t.replace(/[^\s(]+-[^\s),]+/g, (m) => `<span style="white-space:nowrap">${m}</span>`);

/**
 * Le dos. L'en-tête (logo, filet bleu) et le pied (poids net, conservation,
 * emplacements du QR et du code-barres) viennent du dos d'origine ; tout le
 * reste est recomposé depuis la formule : tableau des actifs à gauche, le
 * complexe à droite, ingrédients, mode d'emploi, précautions.
 */
function dosHtml(g, fond) {
  const dos = file(join(SRC, "dos.jpg"));
  const ligne = (a) => `<tr><td>${a.nom}</td><td class="q">${a.quantite ?? ""}</td></tr>`;
  return `<!doctype html><meta charset="utf-8"><style>${fonts}
#c{position:relative;width:1500px;height:2102px;overflow:hidden;background:${fond};color:#141416;font:23px/31.5px Cousine,monospace}
.tete{position:absolute;left:0;top:0;width:1500px;height:176px;background:url('${dos}') 0 0/1500px 2102px}
.pied{position:absolute;left:0;top:1750px;width:1500px;height:352px;background:url('${dos}') 0 -1750px/1500px 2102px}
.cache{position:absolute;left:1080px;top:104px;width:360px;height:34px;background:${fond}}
.saveur{position:absolute;right:71px;top:105px;height:32px;font:21.4px/32px Cousine,monospace;letter-spacing:2.3px;margin-right:-2.3px;text-transform:uppercase;white-space:nowrap}
#m{position:absolute;left:70px;top:186px;width:1360px;height:1556px;display:flex;flex-direction:column;justify-content:space-between}
.deno{font:800 28px/36px Montserrat,sans-serif;letter-spacing:-0.2px;margin:0}
.tag{display:inline-block;background:#0f0f13;color:${fond};font:700 19px/40px Cousine,monospace;letter-spacing:3.6px;text-transform:uppercase;padding:0 12px 0 12px;margin:0 0 15px}
.cols{display:grid;grid-template-columns:1fr 1fr;column-gap:56px}
table{width:100%;border-collapse:collapse}
th{font:400 18px/40px Cousine,monospace;letter-spacing:1.4px;text-transform:uppercase;text-align:left;border-bottom:2.5px solid #141416;white-space:nowrap}
td{height:39.6px;padding:0;border-bottom:1.5px solid rgba(20,20,22,.28);white-space:nowrap}
.q{text-align:right}
.note{margin:14px 0 0;padding:10px 14px;border:2.5px solid #141416;font:700 20px/27px Cousine,monospace}
.note span{font-weight:400}
p{margin:0}
b{font-weight:700}
.boite{border:3px solid #141416;padding:11px 16px;margin:0 0 10px;font-weight:700}
</style><div id="c">
<div class="tete"></div><div class="cache"></div><div class="saveur">${g.saveur}</div>
<div id="m">
<p class="deno">${FORMULE.denomination}</p>
<section><div class="tag">Informations nutritionnelles</div>
<div class="cols">
<div><table><tr><th>Par dose journalière (1 dose = ${FORMULE.dose})</th><th class="q">Quantité</th></tr>${FORMULE.actifs.map(ligne).join("")}</table></div>
<div><table><tr><th>${FORMULE.complexe.nom}</th><th class="q">${FORMULE.complexe.quantite}</th></tr>${FORMULE.complexe.ingredients.map(ligne).join("")}</table>
<p class="note">Caféine totale : environ ${FORMULE.cafeineTotale} par dose <span>(dicaféine malate + caféine anhydre).</span></p></div>
</div></section>
<section><div class="tag">Ingrédients</div><p>${insecable(ingredientsDe(g))}</p></section>
<section><div class="tag">Conseils d'utilisation</div><p>${FORMULE.usage} <b>${FORMULE.usageFort}</b> ${FORMULE.usageFin}</p></section>
<section><div class="tag">Précautions d'emploi</div><p class="boite">${FORMULE.avertissementCafeine}</p><p>${FORMULE.precautions}</p></section>
<section><div class="tag">Bon à savoir</div><p>${FORMULE.bonASavoir}</p></section>
</div>
<div class="pied"></div>
</div>`;
}

/** L'étiquette complète : la face au centre, le dos sur la couture arrière, la phrase du couvercle tout autour. */
function wrapHtml(face, dos) {
  const phrase = Array.from({ length: 5 }, () => "<i>·</i><span>RIEN NE SE SCULPTE EN SILENCE.</span>").join("") + "<i>·</i>";
  return `<!doctype html><meta charset="utf-8"><style>${fonts}
#c{position:relative;width:4096px;height:1652px;overflow:hidden;background:url('${file(join(SRC, "papier.jpg"))}') 0 0/1396px 1396px}
#front{position:absolute;left:372px;top:107px;width:3351px;height:1438px;
  -webkit-mask-image:linear-gradient(to right,transparent 0,#000 110px,#000 calc(100% - 110px),transparent 100%),linear-gradient(to bottom,transparent 0,#000 14px,#000 calc(100% - 40px),transparent 100%);
  -webkit-mask-composite:source-in;mask-composite:intersect}
.dos{position:absolute;top:452px;height:1050px;width:749px;mix-blend-mode:multiply;filter:brightness(1.1) contrast(1.18)}
.lid{position:absolute;top:128px;width:2605px;height:38px;display:flex;justify-content:space-between;align-items:center;
  font:500 26px/1 JBM,monospace;color:#17181b;white-space:nowrap;transform:scaleY(1.27);transform-origin:center;opacity:.93}
</style><div id="c">
<img id="front" src="${file(face)}">
<img class="dos" src="${file(dos)}" style="left:-374.5px"><img class="dos" src="${file(dos)}" style="left:3721.5px">
<div class="lid" style="left:2800px">${phrase}</div><div class="lid" style="left:-1296px">${phrase}</div>
</div>`;
}

async function main() {
  const only = process.argv[2];
  mkdirSync(OUT, { recursive: true });
  // La couleur du fond du dos, relevée dans une zone vide
  const { data } = await sharp(join(SRC, "dos.jpg")).extract({ left: 1440, top: 40, width: 20, height: 20 }).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const fond = `rgb(${data[0]},${data[1]},${data[2]})`;
  const dir = mkdtempSync(join(tmpdir(), "gout-"));
  try {
    // La face commune à tous les goûts : celle d'origine, avec la ligne de dosages de la formule.
    const base = await lire(join(SRC, "face.jpg"));
    if (LIGNE !== LIGNE_ORIGINE) await remplacerLigne(base, { axe: [[2733, 1408], [2733, 296]], demi: 19 }, { ancien: LIGNE_ORIGINE, nouveau: LIGNE }, dir);

    for (const g of GOUTS.filter((x) => !only || x.slug === only)) {
      const dosPng = join(dir, "dos.png");
      shoot(dosHtml(g, fond), 1500, 2102, dosPng, dir);
      const dos = join(OUT, `dos-${g.slug}.jpg`);
      await sharp(dosPng).extract({ left: 0, top: 0, width: 1500, height: 2102 }).jpeg({ quality: 92 }).toFile(dos);

      // La face du goût : la pastille d'origine est effacée, le nom du goût imprimé dans sa couleur.
      const img = { ...base, data: Buffer.from(base.data) };
      await remplacerPastille(img, FACE_PASTILLE, marque(g), dir);
      const face = join(dir, "face.jpg");
      await ecrire(img, face);

      const wrapPng = join(dir, "wrap.png");
      shoot(wrapHtml(face, dos), 4096, 1652, wrapPng, dir);
      const wrap = join(OUT, `wrap-${g.slug}.jpg`);
      await sharp(wrapPng).extract({ left: 0, top: 0, width: 4096, height: 1652 }).jpeg({ quality: 90 }).toFile(wrap);
      if (g.slug === GOUTS[0].slug) copyFileSync(wrap, join(OUT, "wrap.jpg"));
      // Contrôle : le marquage du goût et les mentions, à la loupe
      await sharp(face).extract({ left: 2040, top: 1380, width: 760, height: 230 }).resize({ width: 1140 }).jpeg({ quality: 90 }).toFile(join(OUT, `controle-gout-${g.slug}.jpg`));
      console.log("✓", g.slug);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
