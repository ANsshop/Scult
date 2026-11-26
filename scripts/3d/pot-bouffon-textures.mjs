#!/usr/bin/env node
// Textures du pot SCULT pré-workout (le « bouffon »), tirées des photos produit.
//
//   node scripts/3d/pot-bouffon-textures.mjs [dossier de sortie]
//
// Lit  .bouffon-src/pot-packshot.png  (face, appareil un peu au-dessus)
//      .bouffon-src/pot-vues.png      (planche de 7 vues ; on y prend le couvercle vu du dessus)
// Écrit docs/3d/bouffon/textures/wrap.jpg     l'étiquette déroulée, tout le tour du corps
//       docs/3d/bouffon/textures/lid-top.jpg  le dessus du couvercle (le sourire)
//
// wrap.jpg — u = 0,5 est le centre de la face, la couture est au dos ; v = 0 est
// le bas du pot, v = 1 le haut du corps, sous le couvercle.
//   * La face (± 74°) vient des pixels du packshot, déroulés sur le cylindre :
//     une colonne à l'angle θ lit la photo en x = CX + R·sin θ, et la ligne suit
//     l'ellipse que dessine un cercle horizontal vu d'un peu haut :
//     y = y_face + B·(cos θ − 1) + T·sin θ. B (l'affaissement) et T (l'image
//     penche d'un demi-degré) sont calés sur les bords de la bande rose du bas
//     et de l'anneau rose du couvercle, à 1 px près. B ne varie pas du haut en
//     bas du pot : la photo se lit comme une vue sans perspective.
//   * La lumière de la photo est neutralisée sans rien repeindre : on retire le
//     voile gris que le contre-jour pose sur les bords et l'ombre du couvercle
//     en haut du corps, et on remonte le rose qui s'éteint en lumière rasante.
//     Les reflets du film métallique, eux, restent.
//   * Au-delà (74° → 82° en fondu ; 62° → 72° pour la bande du bas, qui ne
//     porte plus rien après « 400 G »), le dos est fabriqué : noir, la même
//     bande rose prolongée tout autour, des tirets roses comme sur la vue de dos.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, ".bouffon-src");
const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, "docs/3d/bouffon/textures"));

// --- Relevés sur pot-packshot.png (1792 × 2240), en pixels ------------------
const CX = 878.5;        // axe du pot
const R_PX = 597;        // rayon du corps
const Y_BOT = 2214;      // bas du pot, au centre de la face  (v = 0)
const Y_TOP = 625;       // haut du corps, sous la gorge      (v = 1)
// Ellipses ajustées sur la photo : [y au centre de la face, affaissement B, pente T]
const ELLIPSES = [
  [609.0, 137.0, 1.4],   // bas de l'anneau rose du couvercle
  [1993.8, 137.3, 6.5],  // haut de la bande rose
  [2142.1, 134.4, 4.0],  // bas de la bande rose
];
// --- Le pot, pour les proportions de la texture -----------------------------
const RADIUS = 0.0432;   // m — mêmes valeurs que scripts/3d/build_pot_bouffon.py (R et Z_BODY)
const LABEL_H = 0.1178;  // m
// --- Sortie ------------------------------------------------------------------
const TW = 4096;
const TH = Math.round((TW * LABEL_H) / (2 * Math.PI * RADIUS)); // 1778
const DEG = Math.PI / 180;
const FRONT_FULL = 74 * DEG; // jusque-là : la photo
const FRONT_END = 82 * DEG;  // au-delà : le dos fabriqué
const BAND_FULL = 62 * DEG;  // la bande du bas ne porte rien après « 400 G » : le fondu y commence plus tôt,
const BAND_END = 72 * DEG;   // avant que le film ne grise en lumière rasante
const BLACK = 20;            // le noir du pot (sRGB 0-255), commun aux textures et aux matières
const V_BAND = [(Y_BOT - ELLIPSES[2][0]) / (Y_BOT - Y_TOP), (Y_BOT - ELLIPSES[1][0]) / (Y_BOT - Y_TOP)]; // la bande rose du bas

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lumOf = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const pinkness = (r, g, b) => clamp((r - g - 25) / 40, 0, 1) * clamp((b - g + 10) / 30, 0, 1);

// Aléa reproductible
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

async function raw(file, extract) {
  let img = sharp(file).removeAlpha();
  if (extract) img = img.extract(extract);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

// Lecture bicubique (Catmull-Rom) d'un canal
function cubic(img, x, y, ch) {
  const { data, w, h } = img;
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const wgt = (t) => [((-t + 2) * t - 1) * t / 2, ((3 * t - 5) * t * t + 2) / 2, ((-3 * t + 4) * t + 1) * t / 2, (t - 1) * t * t / 2];
  const wx = wgt(fx), wy = wgt(fy);
  let acc = 0;
  for (let j = 0; j < 4; j++) {
    const yy = clamp(y0 - 1 + j, 0, h - 1);
    let row = 0;
    for (let i = 0; i < 4; i++) row += wx[i] * data[(yy * w + clamp(x0 - 1 + i, 0, w - 1)) * 3 + ch];
    acc += wy[j] * row;
  }
  return acc;
}

// Bruit doux (grain du carton noir), valeurs centrées
function grain(w, h, seed, blur) {
  const rnd = rng(seed);
  const a = new Float32Array(w * h);
  for (let i = 0; i < a.length; i++) a[i] = rnd() + rnd() + rnd() - 1.5;
  const b = new Float32Array(w * h);
  for (let pass = 0; pass < blur; pass++) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b[y * w + x] = (a[y * w + (x + w - 1) % w] + 2 * a[y * w + x] + a[y * w + (x + 1) % w]) / 4;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a[y * w + x] = (b[Math.max(0, y - 1) * w + x] + 2 * b[y * w + x] + b[Math.min(h - 1, y + 1) * w + x]) / 4;
  }
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  const k = 1 / Math.sqrt(s / a.length);
  for (let i = 0; i < a.length; i++) a[i] *= k; // écart-type 1
  return a;
}

// ---------------------------------------------------------------------------
// 1. L'étiquette
// ---------------------------------------------------------------------------
async function wrap() {
  const photo = await raw(path.join(SRC, "pot-packshot.png"));
  // Affaissement et pente à la hauteur y : interpolés entre les ellipses relevées
  const ellipseAt = (y) => {
    const E = ELLIPSES;
    if (y <= E[0][0]) return E[0];
    for (let k = 1; k < E.length; k++) if (y <= E[k][0]) { const t = (y - E[k - 1][0]) / (E[k][0] - E[k - 1][0]); return E[k].map((val, q) => E[k - 1][q] + (val - E[k - 1][q]) * t); }
    return E[E.length - 1];
  };
  const thetaOf = (i) => ((i + 0.5) / TW - 0.5) * 2 * Math.PI;
  const vOf = (j) => 1 - (j + 0.5) / TH;

  // a) Déroulé de la face, en flottants
  const i0 = Math.floor((0.5 - FRONT_END / (2 * Math.PI)) * TW) - 2;
  const i1 = Math.ceil((0.5 + FRONT_END / (2 * Math.PI)) * TW) + 2;
  const FW = i1 - i0;
  const front = new Float32Array(FW * TH * 3);
  for (let j = 0; j < TH; j++) {
    const yf = Y_BOT + (Y_TOP - Y_BOT) * vOf(j);
    const [, sag, tilt] = ellipseAt(yf);
    for (let i = i0; i < i1; i++) {
      const th = thetaOf(i);
      const s = Math.sin(th);
      const x = CX + R_PX * s;
      const y = yf + sag * (Math.cos(th) - 1) + tilt * s;
      const o = (j * FW + (i - i0)) * 3;
      for (let ch = 0; ch < 3; ch++) front[o + ch] = clamp(cubic(photo, x, y, ch), 0, 255);
    }
  }

  // b) Mesure de la lumière, colonne par colonne
  //    voile : le niveau médian du noir, hors rose ; rose : la couleur médiane de la bande du bas
  const jBand0 = Math.round((1 - V_BAND[1] + 0.012) * TH), jBand1 = Math.round((1 - V_BAND[0] - 0.012) * TH);
  const jLab0 = Math.round(0.04 * TH), jLab1 = Math.round((1 - V_BAND[1] - 0.02) * TH);
  const veilRaw = new Float32Array(FW), band = new Array(FW).fill(null);
  const median = (v) => v.sort((a, b) => a - b)[v.length >> 1];
  for (let c = 0; c < FW; c++) {
    const darks = [], pinks = [[], [], []];
    for (let j = jLab0; j < jLab1; j += 2) {
      const o = (j * FW + c) * 3;
      if (pinkness(front[o], front[o + 1], front[o + 2]) < 0.05) darks.push(lumOf(front[o], front[o + 1], front[o + 2]));
    }
    for (let j = jBand0; j < jBand1; j++) {
      const o = (j * FW + c) * 3;
      if (pinkness(front[o], front[o + 1], front[o + 2]) > 0.8) for (let ch = 0; ch < 3; ch++) pinks[ch].push(front[o + ch]);
    }
    veilRaw[c] = darks.length ? median(darks) : BLACK;
    if (pinks[0].length > 20) band[c] = pinks.map(median);
  }
  // Sous le personnage (± 52°) le noir de l'étiquette ne se mesure pas : on tire droit entre les deux flancs
  const colOf = (deg) => clamp(Math.round((0.5 + (deg * DEG) / (2 * Math.PI)) * TW) - i0, 0, FW - 1);
  const mean = (arr, a, b) => { let s = 0; for (let c = a; c < b; c++) s += arr[c]; return s / (b - a); };
  const vl = mean(veilRaw, colOf(-60), colOf(-52)), vr = mean(veilRaw, colOf(52), colOf(60));
  for (let c = colOf(-52); c <= colOf(52); c++) veilRaw[c] = vl + ((vr - vl) * (c - colOf(-52))) / (colOf(52) - colOf(-52));
  const span = Math.round((4 * DEG * TW) / (2 * Math.PI)); // lissage sur ± 4°
  const veil = new Float32Array(FW);
  for (let c = 0; c < FW; c++) veil[c] = mean(veilRaw, Math.max(0, c - span), Math.min(FW, c + span + 1)) - BLACK;
  // L'ombre du couvercle : le noir médian de chaque ligne, lu sur les flancs (54° – 72°), voile retiré
  const shadeRaw = new Float32Array(TH);
  for (let j = 0; j < TH; j++) {
    const darks = [];
    for (const [a, b] of [[-72, -54], [54, 72]]) for (let c = colOf(a); c < colOf(b); c += 3) {
      const o = (j * FW + c) * 3;
      if (pinkness(front[o], front[o + 1], front[o + 2]) < 0.05) darks.push(lumOf(front[o], front[o + 1], front[o + 2]) - veil[c]);
    }
    darks.sort((a, b) => a - b);
    shadeRaw[j] = j < jLab1 && darks.length > 20 ? darks[darks.length >> 1] - BLACK : NaN;
  }
  for (let j = 0; j < TH; j++) if (Number.isNaN(shadeRaw[j])) shadeRaw[j] = j > 0 ? shadeRaw[j - 1] : 0; // sous la bande : la dernière valeur
  const shade = new Float32Array(TH), spanV = Math.round(0.012 * TH);
  for (let j = 0; j < TH; j++) shade[j] = mean(shadeRaw, Math.max(0, j - spanV), Math.min(TH, j + spanV + 1));
  // Le rose : un gain par canal, fonction de |θ| seulement. Nul avant 50° (les reflets du film restent) ;
  // ensuite il ramène la bande, qui s'éteint et grise en lumière rasante, à sa couleur de référence.
  const bandAt = (ranges) => {
    const v = [[], [], []];
    for (const [a, b] of ranges) for (let c = colOf(a); c <= colOf(b); c++) if (band[c]) for (let ch = 0; ch < 3; ch++) v[ch].push(band[c][ch] - veil[c]);
    return v[0].length ? v.map(median) : null;
  };
  const PINK = bandAt([[-56, -42], [42, 56]]); // la couleur du film, reprise pour le dos
  const GAIN_STEP = 2; // degrés
  const gainTab = [];
  for (let a = 0; a <= 90; a += GAIN_STEP) {
    const prev = gainTab[gainTab.length - 1];
    if (a < 50) { gainTab.push([1, 1, 1]); continue; }
    const m = bandAt([[-a - 1, -a + 1], [a - 1, a + 1]]);
    gainTab.push([0, 1, 2].map((ch) => {
      const g = m ? PINK[ch] / Math.max(1, m[ch]) : prev[ch];
      return ch === 1 ? Math.min(clamp(g, 0.4, 1), prev[ch]) : Math.max(clamp(g, 1, 1.8), prev[ch]); // le vert baisse, rouge et bleu montent
    }));
  }
  const gainAt = (th, ch) => { const a = Math.min(89.999, Math.abs(th) / DEG) / GAIN_STEP; const k = Math.floor(a); return gainTab[k][ch] + (gainTab[k + 1][ch] - gainTab[k][ch]) * (a - k); };
  console.log(`  lumière : noir ${vl.toFixed(1)} à gauche, ${vr.toFixed(1)} à droite, voile +${veil[colOf(74)].toFixed(0)} à 74°, ombre ${shade[Math.round(0.04 * TH)].toFixed(1)} en haut / ${shade[jLab1 - 1].toFixed(1)} en bas ; rose du film ${PINK.map(Math.round)} ; gain du rose (r v b) à 60° : ${[0, 1, 2].map((ch) => gainAt(60 * DEG, ch).toFixed(2))}, à 72° : ${[0, 1, 2].map((ch) => gainAt(72 * DEG, ch).toFixed(2))}`);

  // c) Le dos fabriqué : noir à grain, bande, tirets
  const g1 = grain(1024, 512, 7, 1), g2 = grain(1024, 512, 11, 6);
  const noise = (i, j) => 1.5 * g1[(j % 512) * 1024 + (i % 1024)] + 1.2 * g2[((j >> 1) % 512) * 1024 + ((i >> 1) % 1024)];
  const foil = grain(256, 64, 23, 6); // moirures du film, très étirées en largeur (période : un tour exactement)
  const foilAt = (i, j) => foil[((j >> 1) % 64) * 256 + (Math.floor((i * 256) / TW) % 256)];
  // Tirets du dos : [centre en degrés depuis la face, v, longueur en degrés, pente]
  const dashRnd = rng(1993);
  const dashes = [];
  const rows = [0.86, 0.74, 0.63, 0.52, 0.41, 0.3, 0.2];
  for (let n = 0; n < 15; n++) {
    const centre = 96 + (168 * (n + 0.15 + 0.7 * dashRnd())) / 15; // de 96° à 264°, bien réparti
    const v = rows[(n * 3 + 1) % rows.length] + (dashRnd() - 0.5) * 0.05;
    dashes.push([centre, v, 9 + dashRnd() * 9, (dashRnd() - 0.5) * 0.012]);
  }
  const DASH_H = 0.0062; // épaisseur d'un tiret, en part de la hauteur (0,75 mm)
  const backAt = (i, j) => {
    const th = thetaOf(i), v = vOf(j);
    const deg = ((th / DEG) + 360) % 360;
    let pink = smooth(V_BAND[0] - 0.0008, V_BAND[0] + 0.0008, v) * (1 - smooth(V_BAND[1] - 0.0008, V_BAND[1] + 0.0008, v));
    for (const [c, dv, len, slope] of dashes) {
      const du = deg - c;
      if (Math.abs(du) > len) continue;
      const along = 1 - smooth(len / 2 - 0.08, len / 2 + 0.08, Math.abs(du));
      const across = 1 - smooth(DASH_H / 2 - 0.0006, DASH_H / 2 + 0.0006, Math.abs(v - dv - slope * (du / len)));
      pink = Math.max(pink, along * across);
    }
    const n = noise(i, j);
    const k = 1 + 0.018 * foilAt(i, j);
    const fine = 1.5 * g1[(j % 512) * 1024 + (i % 1024)];
    return [0, 1, 2].map((ch) => (BLACK + n) * (1 - pink) + clamp(PINK[ch] * k + fine, 0, 255) * pink);
  };

  // d) Assemblage
  const out = Buffer.alloc(TW * TH * 3);
  for (let j = 0; j < TH; j++) {
    const v = vOf(j);
    // Haut (épaule) et bas (arrondi du fond) : noir uni, pour raccorder avec les matières noires du modèle
    const edge = smooth(0.026, 0.036, v) * (1 - smooth(0.972, 0.984, v));
    const inBand = 1 - smooth(V_BAND[1] + 0.004, V_BAND[1] + 0.02, v);
    const full = FRONT_FULL + (BAND_FULL - FRONT_FULL) * inBand, end = FRONT_END + (BAND_END - FRONT_END) * inBand;
    for (let i = 0; i < TW; i++) {
      const th = thetaOf(i);
      const wFront = 1 - smooth(full, end, Math.abs(th));
      const back = wFront < 1 ? backAt(i, j) : null;
      let px = back;
      if (wFront > 0) {
        const c = i - i0, o = (j * FW + c) * 3;
        const p = pinkness(front[o], front[o + 1], front[o + 2]);
        const f = [0, 1, 2].map((ch) => clamp((front[o + ch] - veil[c] - shade[j] * (1 - p)) * (1 + (gainAt(th, ch) - 1) * p), 0, 255));
        px = back ? f.map((x, ch) => x * wFront + back[ch] * (1 - wFront)) : f;
      }
      const o2 = (j * TW + i) * 3;
      for (let ch = 0; ch < 3; ch++) out[o2 + ch] = Math.round(clamp(px[ch] * edge + BLACK * (1 - edge), 0, 255));
    }
  }
  const file = path.join(OUT, "wrap.jpg");
  await sharp(out, { raw: { width: TW, height: TH, channels: 3 } }).jpeg({ quality: 90, chromaSubsampling: "4:4:4" }).toFile(file);
  console.log(`  ${path.relative(ROOT, file)}  ${TW} × ${TH}`);
}

// ---------------------------------------------------------------------------
// 2. Le dessus du couvercle
// ---------------------------------------------------------------------------
async function lidTop() {
  // La vue « couvercle vu du dessus » de la planche ; le bas de l'image est le devant du pot.
  const view = await raw(path.join(SRC, "pot-vues.png"), { left: 7, top: 775, width: 721, height: 735 });
  const LCX = 362.3, LCY = 347, LR = 312; // le cercle du couvercle dans cette vue (ajusté sur son contour)
  const S = 768;
  // Niveau du noir du couvercle : un plan ajusté sur les pixels non roses (la vue est plus claire en haut),
  // recalé ensuite sur la médiane
  const dark = (o) => pinkness(view.data[o], view.data[o + 1], view.data[o + 2]) <= 0.02 && lumOf(view.data[o], view.data[o + 1], view.data[o + 2]) <= 90;
  let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sl = 0, sxl = 0, syl = 0;
  for (let y = 0; y < view.h; y += 2) for (let x = 0; x < view.w; x += 2) {
    const dx = (x - LCX) / LR, dy = (y - LCY) / LR;
    if (dx * dx + dy * dy > 0.86 * 0.86) continue;
    const o = (y * view.w + x) * 3;
    const l = lumOf(view.data[o], view.data[o + 1], view.data[o + 2]);
    if (!dark(o)) continue;
    n++; sx += dx; sy += dy; sxx += dx * dx; syy += dy * dy; sl += l; sxl += dx * l; syl += dy * l;
  }
  const gx = (sxl - (sx * sl) / n) / (sxx - (sx * sx) / n), gy = (syl - (sy * sl) / n) / (syy - (sy * sy) / n);
  const plane = (dx, dy) => gx * (dx - sx / n) + gy * (dy - sy / n);
  const flat = [];
  for (let y = 0; y < view.h; y += 2) for (let x = 0; x < view.w; x += 2) {
    const dx = (x - LCX) / LR, dy = (y - LCY) / LR, o = (y * view.w + x) * 3;
    if (dx * dx + dy * dy <= 0.86 * 0.86 && dark(o)) flat.push(lumOf(view.data[o], view.data[o + 1], view.data[o + 2]) - plane(dx, dy));
  }
  flat.sort((a, b) => a - b);
  const l0 = flat[flat.length >> 1];
  console.log(`  couvercle : noir médian ${l0.toFixed(1)}, pente ${gx.toFixed(1)} / ${gy.toFixed(1)} → ramené à ${BLACK}`);
  const out = Buffer.alloc(S * S * 3);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const dx = ((i + 0.5) / S) * 2 - 1, dy = ((j + 0.5) / S) * 2 - 1;
    const r = Math.hypot(dx, dy);
    const x = LCX + dx * LR, y = LCY + dy * LR;
    const p = [0, 1, 2].map((ch) => clamp(cubic(view, x, y, ch), 0, 255));
    const pk = pinkness(p[0], p[1], p[2]);
    const off = (l0 + plane(dx, dy) - BLACK) * (1 - pk);
    // Le bord (chanfrein, reflets de la photo) : noir uni, le modèle porte son propre arrondi
    const keep = 1 - smooth(0.9, 0.95, r);
    const o = (j * S + i) * 3;
    for (let ch = 0; ch < 3; ch++) out[o + ch] = Math.round(clamp((p[ch] - off) * keep + BLACK * (1 - keep), 0, 255));
  }
  const file = path.join(OUT, "lid-top.jpg");
  await sharp(out, { raw: { width: S, height: S, channels: 3 } }).jpeg({ quality: 90, chromaSubsampling: "4:4:4" }).toFile(file);
  console.log(`  ${path.relative(ROOT, file)}  ${S} × ${S}`);
}

await mkdir(OUT, { recursive: true });
console.log("Textures du pot bouffon");
await wrap();
await lidTop();
