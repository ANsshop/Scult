/**
 * Les textures de la boîte de pochons en 3D, à partir de la feuille de
 * référence du produit (docs/refonte-bouffon/sources/planche-pochons.jpg) :
 *
 *   couvercle.jpg  le dessus, découpé dans la première vue de la feuille
 *                  (la boîte vue de dessus), redressé en disque ;
 *   bande.jpg      la bande rose de la tranche, refaite ici : sur la feuille
 *                  elle n'est jamais vue à plat, et son texte y est mal écrit
 *                  sur la vue de côté. Le texte est celui de la feuille ;
 *   dessous.jpg    le fond blanc et le sourire chromé (celui de
 *                  public/brand/, détouré dans la photo du couvercle du pot).
 *
 *   node scripts/3d/boite-pochons-textures.mjs   (appelé par build-pochons.sh)
 *
 * ⚠ Maquette : la boîte est une proposition d'emballage, pas un fichier
 * d'impression. Voir ASSUMPTIONS.md.
 */
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const SHEET = "docs/refonte-bouffon/sources/planche-pochons.jpg";
const OUT = "docs/3d/pochons/textures";
mkdirSync(OUT, { recursive: true });

// — Le couvercle : le disque de la boîte dans la première vue (centre et rayons relevés sur la feuille, 2688 × 1520) —
const DISC = { cx: 332, cy: 370, rx: 297, ry: 297 };
const SIZE = 1400;
const crop = await sharp(SHEET)
  .extract({ left: DISC.cx - DISC.rx, top: DISC.cy - DISC.ry, width: DISC.rx * 2, height: DISC.ry * 2 })
  .resize(SIZE, SIZE, { fit: "fill", kernel: "lanczos3" })   // l'ellipse redevient un cercle
  .png().toBuffer();
// Hors du disque : le blanc de la boîte (le fond gris de la feuille ne doit pas déborder sur le bord arrondi).
const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2 - 10}" fill="#fff"/></svg>`);
const disc = await sharp(crop).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: "#f7f7f7" } }).composite([{ input: disc }]).jpeg({ quality: 90 }).toFile(`${OUT}/couvercle.jpg`);
// Le même disque, sans fond : l'image fixe montrée avant la 3D.
await sharp(disc).resize(900).webp({ quality: 88 }).toFile("public/models/boite-pochons-poster.webp");

// — La bande : un film rose métallisé, le texte de la feuille en noir, deux fois autour de la boîte —
const BW = 4096, BH = 420;
const TEXT = ["SCULT", "SANS TABAC", "200 MG CAFÉINE", "SANS NICOTINE", "30 POCHONS"];
// Le film : un rose un peu froissé (des bandes verticales plus claires et plus sombres), comme sur les photos.
let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const stripes = Array.from({ length: 70 }, () => {
  const x = Math.round(rand() * BW), w = 20 + Math.round(rand() * 160), light = rand() > 0.5;
  return `<rect x="${x}" y="0" width="${w}" height="${BH}" fill="${light ? "#ff8cc4" : "#b3125f"}" fill-opacity="${(0.1 + rand() * 0.22).toFixed(2)}"/>`;
}).join("");
const foil = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}"><rect width="${BW}" height="${BH}" fill="#f0258a"/>${stripes}</svg>`)).blur(14).png().toBuffer();
const line = `${TEXT.join("  •  ")}  •  `;
const text = await sharp({ text: { text: `<span font_desc="Arial Narrow Bold 150" foreground="#0b0b0b">${line.replace(/&/g, "&amp;")}</span>`, rgba: true, dpi: 72 } }).png().toBuffer({ resolveWithObject: true });
// Une copie par moitié de la bande, réduite à sa largeur si besoin.
const half = BW / 2;
const scale = Math.min(1, (half - 40) / text.info.width);
const fitted = await sharp(text.data).resize({ width: Math.round(text.info.width * scale) }).png().toBuffer({ resolveWithObject: true });
const top = Math.round((BH - fitted.info.height) / 2);
await sharp(foil).composite([0, 1].map((k) => ({ input: fitted.data, left: k * half + Math.round((half - fitted.info.width) / 2), top }))).jpeg({ quality: 90 }).toFile(`${OUT}/bande.jpg`);

// — Le dessous : blanc, le sourire chromé, et des lignes grises à la place des mentions (pas encore de texte légal) —
const grin = await sharp(`${OUT}/sourire-source.png`).resize({ width: Math.round(SIZE * 0.6) }).png().toBuffer({ resolveWithObject: true });
const lines = Array.from({ length: 5 }, (_, i) => `<rect x="${SIZE * 0.27}" y="${SIZE * 0.62 + i * 26}" width="${SIZE * (i === 4 ? 0.3 : 0.46)}" height="9" rx="4" fill="#b9b9b9"/>`).join("");
await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: "#f7f7f7" } })
  .composite([
    { input: grin.data, left: Math.round((SIZE - grin.info.width) / 2), top: Math.round(SIZE * 0.3) },
    { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">${lines}</svg>`) },
  ])
  .jpeg({ quality: 90 }).toFile(`${OUT}/dessous.jpg`);

// — Les cartes « métal » (vert = rugosité, bleu = métal), posées par la visionneuse : le rose brille, le reste est mat —
async function metal(input, output, width, { all = false } = {}) {
  const { data, info } = await sharp(`${OUT}/${input}`).resize({ width }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0, o = 0; i < data.length; i += info.channels, o += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const pink = Math.max(0, Math.min(1, (r - g - 45) / 50)) * Math.max(0, Math.min(1, (b - g + 10) / 30)) * Math.max(0, Math.min(1, (r - 70) / 50));
    const m = all ? Math.max(pink, 0) : pink;
    out[o] = 255;
    out[o + 1] = Math.round(255 * (0.62 + (0.24 - 0.62) * m));
    out[o + 2] = Math.round(255 * m);
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }).blur(0.6).jpeg({ quality: 86, chromaSubsampling: "4:4:4" }).toFile(`public/models/${output}`);
}
await metal("couvercle.jpg", "boite-pochons-metal-couvercle.jpg", 700);
await metal("bande.jpg", "boite-pochons-metal-bande.jpg", 2048);
await metal("dessous.jpg", "boite-pochons-metal-dessous.jpg", 700);
console.log(`✓ textures de la boîte de pochons dans ${OUT}, cartes métal et image fixe dans public/models`);
