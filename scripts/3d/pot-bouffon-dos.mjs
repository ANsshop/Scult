/**
 * Le dos de l'étiquette du pot 3D : composition par dose, ingrédients,
 * conseils d'utilisation, précautions. Tout est lu dans
 * src/lib/content/cri-formule.json — la source de la fiche produit — puis
 * écrit en texte sur un panneau noir, posé au dos de l'étiquette
 * (docs/3d/bouffon/textures/wrap.jpg, à cheval sur la couture : u = 0).
 *
 *   node scripts/3d/pot-bouffon-dos.mjs     (appelé par build-bouffon.sh, après les textures)
 *
 * ⚠ Maquette, pas un fichier d'impression : corps de texte, mentions
 * obligatoires manquantes (responsable, lot, date, code-barres, tri) et mise
 * en page restent à faire avec l'étiquette réelle. Voir ASSUMPTIONS.md.
 */
import { readFileSync } from "node:fs";
import sharp from "sharp";

const WRAP = "docs/3d/bouffon/textures/wrap.jpg";
const F = JSON.parse(readFileSync("src/lib/content/cri-formule.json", "utf8"));
const GOUT = Object.values(F.gouts)[0];

/** Le panneau : 1800 × 1430 px sur une étiquette de 4096 × 1778 (15 px par mm), au-dessus de la bande rose. */
const W = 1800, H = 1430, TOP = 60, PAD = 56, GAP = 64;
const COL = (W - 2 * PAD - GAP) / 2;
const NOIR = { r: 20, g: 20, b: 20 };
const CLAIR = "#F2F0EA", ROSE = "#FF2E93", GRIS = "#B9B6AF";
const FONT = "Arial Narrow";
/** Échelle des corps de texte : réglée pour remplir le panneau sans déborder (le script s'arrête sinon). */
const K = Number(process.env.DOS_ECHELLE ?? 1.28);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const span = (text, { size, color = CLAIR, bold = false }) => `<span font_desc="${FONT} ${bold ? "Bold " : ""}${Math.round(size * K)}" foreground="${color}">${esc(text)}</span>`;

/** Un bloc de texte mis en lignes par Pango, à la largeur donnée. */
async function block(markup, width, align = "left") {
  const { data, info } = await sharp({ text: { text: markup, width, align, rgba: true, dpi: 72, spacing: 6 } }).png().toBuffer({ resolveWithObject: true });
  return { input: data, width: info.width, height: info.height };
}

const layers = [];
/** Pose un bloc dans une colonne et rend la position du bas. */
async function put(markup, x, y, width, align = "left") {
  const b = await block(markup, width, align);
  layers.push({ input: b.input, left: Math.round(align === "right" ? x + width - b.width : x), top: Math.round(y) });
  return y + b.height;
}
const rule = (x, y, width, color = ROSE, h = 3) => layers.push({ input: { create: { width: Math.round(width), height: h, channels: 4, background: color } }, left: Math.round(x), top: Math.round(y) });
const title = async (text, x, y) => { const b = await put(span(text.toUpperCase(), { size: 30, color: ROSE, bold: true }), x, y, COL); rule(x, b + 8, COL); return b + 26; };

// — Colonne de gauche : dénomination, tableau par dose —
let x = PAD, y = PAD;
y = await put(span("COMPLÉMENT ALIMENTAIRE", { size: 44, bold: true }), x, y, COL);
y = await put(span(F.denomination, { size: 26, color: GRIS }), x, y + 10, COL);
y = await title(`Par dose journalière (1 dose = ${F.dose})`, x, y + 34);
for (const a of F.actifs) {
  const b = await put(span(a.nom, { size: 31 }), x, y, COL - 290);
  await put(span(a.quantite, { size: 31, bold: true }), x + COL - 290, y, 290, "right");
  rule(x, b + 9, COL, "#3a3a3a", 2);
  y = b + 20;
}
const c = await put(span(F.complexe.nom, { size: 31, color: ROSE, bold: true }), x, y + 4, COL - 290);
await put(span(F.complexe.quantite, { size: 31, color: ROSE, bold: true }), x + COL - 290, y + 4, 290, "right");
y = await put(span(F.complexe.ingredients.map((i) => i.nom).join(", ") + ".", { size: 25, color: GRIS }), x, c + 8, COL);
y = await put(span(`Poids net : ${F.poids} · ${F.doses} doses · Saveur ${GOUT.nom.toLowerCase()}`, { size: 28, bold: true }), x, y + 30, COL);
const bottomLeft = y;

// — Colonne de droite : ingrédients, conseils, caféine, précautions —
x = PAD + COL + GAP; y = PAD;
y = await title("Ingrédients", x, y);
y = await put(span(F.ingredients.replace("{AROME}", GOUT.arome).replace("{COLORANT}", GOUT.colorant), { size: 25 }), x, y, COL);
y = await title("Conseils d'utilisation", x, y + 30);
y = await put(span(`${F.usage} ${F.usageFort} ${F.usageFin}`, { size: 25 }), x, y, COL);
y = await put(span(F.avertissementCafeine, { size: 28, color: ROSE, bold: true }), x, y + 28, COL);
y = await title("Précautions d'emploi", x, y + 30);
y = await put(span(F.precautions, { size: 23, color: GRIS }), x, y, COL);

const used = Math.max(bottomLeft, y) + PAD;
if (used > H) { console.error(`✗ le dos déborde : ${Math.round(used)} px pour ${H}. Réduire les corps de texte.`); process.exit(1); }

const panel = await sharp({ create: { width: W, height: H, channels: 3, background: NOIR } }).composite(layers).png().toBuffer();
// Le panneau est centré sur la couture : sa moitié gauche finit l'image, sa moitié droite la commence.
const half = W / 2;
const left = await sharp(panel).extract({ left: 0, top: 0, width: half, height: H }).toBuffer();
const right = await sharp(panel).extract({ left: half, top: 0, width: half, height: H }).toBuffer();
const meta = await sharp(WRAP).metadata();
const out = await sharp(WRAP).composite([{ input: left, left: meta.width - half, top: TOP }, { input: right, left: 0, top: TOP }]).jpeg({ quality: 90, chromaSubsampling: "4:4:4" }).toBuffer();
await sharp(out).toFile(WRAP);
await sharp(panel).jpeg({ quality: 82 }).toFile("docs/3d/bouffon/textures/dos.jpg");
console.log(`✓ dos de l'étiquette posé sur ${WRAP} (${W} × ${H}, ${Math.round(used)} px utilisés)`);
