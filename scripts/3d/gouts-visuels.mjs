/**
 * Décline les visuels du site par goût, à partir des photos « fruits rouges ».
 *
 * Sur chaque photo, seule la zone qui change est refaite ; le reste de l'image
 * n'est pas touché.
 *   - face du pot, pot détouré, photo d'ambiance : l'ancienne pastille de goût
 *     est recouverte de papier (pris juste dessous, sur la même photo) et la
 *     nouvelle est posée au même endroit, dans la même perspective ;
 *   - dos du pot : la ligne « Saveur … » et la liste d'ingrédients sont
 *     effacées puis recomposées, avec la courbure du pot ;
 *   - vignettes des sélecteurs de goût, et étiquette allégée de chaque goût
 *     pour la visionneuse 3D.
 *
 *   node scripts/3d/gouts-visuels.mjs            # tous les goûts
 *   node scripts/3d/gouts-visuels.mjs ice-tea-peche
 *
 * À lancer après scripts/3d/gouts.mjs (il lit docs/3d/textures/dos-<goût>.jpg
 * et wrap-<goût>.jpg). Le rendu des pastilles passe par Chrome sans interface.
 */
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { GOUTS, SRC, file, fonts, pastilleCss, pastilleHtml, shoot } from "./gouts.mjs";

const PUBLIC = resolve("public");
const TEX = resolve("docs/3d/textures");

/**
 * Où est la pastille sur chaque photo : ses quatre coins (haut-gauche,
 * haut-droit, bas-droit, bas-gauche), relevés à la loupe. `papier` : la
 * première rangée de papier vierge sous la pastille et la hauteur de la bande
 * utilisable, pour recouvrir l'ancienne.
 */
const PHOTOS = [
  {
    src: "products/cri-01.webp",
    out: (slug) => `products/cri-${slug}-01.webp`,
    coins: [[787.5, 1375], [1061.5, 1375], [1061.5, 1481.5], [787.5, 1481.5]],
    papier: { y: 1489, h: 40 },
  },
  {
    src: "home/pot-detoure.webp",
    out: (slug) => `home/pot-detoure-${slug}.webp`,
    coins: [[547, 934], [738, 934], [738, 1011], [547, 1011]],
    papier: { y: 1018, h: 30 },
    mini: (slug) => `home/pot-mini-${slug}.webp`,
  },
  {
    src: "lifestyle/cri-01.webp",
    out: (slug) => `lifestyle/cri-${slug}-01.webp`,
    coins: [[999, 1777], [1233, 1770.5], [1237.5, 1856.5], [1003, 1872.5]],
    papier: { y: 1876, h: 24 },
  },
];

/** Homographie qui envoie le rectangle (0,0)-(w,h) sur quatre points, en `matrix3d` CSS. */
function matrix3d(w, h, dst) {
  const src = [[0, 0], [w, 0], [w, h], [0, h]];
  const A = [];
  src.forEach(([x, y], i) => {
    const [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  });
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k];
    }
  }
  const [a, b, c, d, e, f, g, i] = A.map((row, k) => row[8] / row[k]);
  return `matrix3d(${a},${d},0,${g}, ${b},${e},0,${i}, 0,0,1,0, ${c},${f},0,1)`;
}

/** Remplace la pastille sur une photo. `g` nul : trace seulement le contour attendu, en rouge (réglage des coins). */
async function pastilleSurPhoto(photo, g, outFile, dir) {
  const srcFile = join(PUBLIC, photo.src);
  const meta = await sharp(srcFile).metadata();
  const flat = join(dir, "photo.png");
  await sharp(srcFile).flatten({ background: "#1238c7" }).png().toFile(flat);

  const xs = photo.coins.map((p) => p[0]), ys = photo.coins.map((p) => p[1]);
  const box = { l: Math.min(...xs), t: Math.min(...ys), r: Math.max(...xs), b: Math.max(...ys) };
  // Zone rendue par Chrome (large : il lui faut une fenêtre confortable) et zone réellement recollée (serrée)
  const R = { l: Math.max(0, Math.floor(box.l - 320)), t: Math.max(0, Math.floor(box.t - 240)) };
  R.w = Math.min(meta.width - R.l, 900);
  R.h = Math.min(meta.height - R.t, 640);
  const P = { l: Math.floor(box.l - 14), t: Math.floor(box.t - 14), w: Math.ceil(box.r - box.l + 28), h: Math.ceil(box.b - box.t + 28) };

  const k = 390 / (box.r - box.l);          // px de la pastille par px de la photo
  const m = 9;                               // débord du cache autour de la pastille (px pastille)
  const bandes = Math.ceil((150 + 2 * m) / (photo.papier.h * k));
  const hb = (150 + 2 * m) / bandes;         // hauteur d'une bande (px pastille)
  const strips = Array.from({ length: bandes }, (_, i) =>
    `<div style="position:absolute;left:0;width:100%;top:${i * hb}px;height:${hb + 0.5}px;background:url('${file(flat)}') no-repeat;background-size:${meta.width * k}px ${meta.height * k}px;background-position:${-(box.l * k - m)}px ${-(photo.papier.y * k)}px;transform:scaleY(${i % 2 ? -1 : 1})"></div>`).join("");
  const local = photo.coins.map(([x, y]) => [x - R.l, y - R.t]);
  const html = `<!doctype html><meta charset="utf-8"><style>${fonts}
#c{position:relative;width:${R.w}px;height:${R.h}px;overflow:hidden;background:url('${file(flat)}') ${-R.l}px ${-R.t}px/${meta.width}px ${meta.height}px no-repeat}
#t{position:absolute;left:0;top:0;width:390px;height:150px;transform-origin:0 0;transform:${matrix3d(390, 150, local)}}
#cache{position:absolute;left:${-m}px;top:${-m}px;width:${390 + 2 * m}px;height:${150 + 2 * m}px;overflow:hidden;border-radius:${50 + m}px;
  -webkit-mask-image:linear-gradient(to right,transparent 0,#000 7px,#000 calc(100% - 7px),transparent 100%),linear-gradient(to bottom,transparent 0,#000 7px,#000 calc(100% - 7px),transparent 100%);
  -webkit-mask-composite:source-in;mask-composite:intersect}
.pastille{left:0;top:0;opacity:${photo.encre ?? 1}}
.repere{position:absolute;left:0;top:0;width:390px;height:150px;box-sizing:border-box;border:2px solid red;border-radius:50px}
${g ? pastilleCss(g) : ""}
</style><div id="c"><div id="t">${g ? `<div id="cache">${strips}</div>${pastilleHtml(g)}` : `<div class="repere"></div>`}</div></div>`;
  const shotFile = join(dir, "shot.png");
  shoot(html, R.w, R.h, shotFile, dir);
  const patch = await sharp(shotFile).extract({ left: P.l - R.l, top: P.t - R.t, width: P.w, height: P.h }).removeAlpha().png().toBuffer();
  mkdirSync(resolve(outFile, ".."), { recursive: true });
  const done = await sharp(srcFile).composite([{ input: patch, left: P.l, top: P.t }]).png().toBuffer();
  await sharp(done).webp({ quality: 90 }).toFile(outFile);
  return done;
}

/**
 * Le dos du pot. L'étiquette à plat (docs/3d/sources/dos.jpg, 1500 px) est
 * posée sur la photo en suivant le cylindre : X = CX + R·sin((x − UC)·A),
 * Y = Y0 + S·y. Coefficients ajustés sur 40 débuts de mots communs aux deux
 * images (écart moyen : un tiers de pixel).
 */
const DOS = { cx: 830.5, r: 717.5, uc: 751.125, a: 0.000967, y0: 570.88, s: 0.6941 };
const DOS_ZONES = [[1080, 104, 360, 34], [60, 964, 1390, 132]]; // les deux zones refaites par gouts.mjs (x, y, l, h)
const ENCRE_MIN = 0.2;  // l'encre la plus noire garde 20 % de la clarté du papier, comme le reste du texte de la photo

async function dosSurPhoto(g, outFile) {
  const photo = await sharp(join(PUBLIC, "products/cri-02.webp")).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const label = await sharp(join(TEX, `dos-${g.slug}.jpg`)).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = photo.info, px = photo.data;
  const LW = label.info.width, LH = label.info.height, lb = label.data;
  const X = (x) => DOS.cx + DOS.r * Math.sin((x - DOS.uc) * DOS.a);
  const lum = (i) => 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
  const sample = (x, y) => {
    if (x < 0 || y < 0 || x >= LW - 1 || y >= LH - 1) return 255;
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, i = yi * LW + xi;
    return lb[i] * (1 - fx) * (1 - fy) + lb[i + 1] * fx * (1 - fy) + lb[i + LW] * (1 - fx) * fy + lb[i + LW + 1] * fx * fy;
  };

  for (const [zx, zy, zw, zh] of DOS_ZONES) {
    const x1 = Math.floor(X(zx)), x2 = Math.ceil(X(zx + zw)), y1 = Math.floor(DOS.y0 + DOS.s * zy), y2 = Math.ceil(DOS.y0 + DOS.s * (zy + zh));
    const w = x2 - x1, h = y2 - y1;
    // 1. Effacer l'ancien texte. Les pixels d'encre et leur halo (élargis de 3 px) sont rebouchés de
    //    proche en proche avec la moyenne de leurs voisins de papier : cela donne la clarté du papier,
    //    lisse. Le grain vient d'une bande de papier vierge de la même photo, à droite de l'étiquette
    //    (mêmes rangées), dont on ne garde que le détail fin.
    const ink = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (lum(((y1 + y) * W + x1 + x) * 3) < 165) ink[y * w + x] = 1;
    const zone = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!ink[y * w + x]) continue;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy >= 0 && yy < h && xx >= 0 && xx < w) zone[yy * w + xx] = 1;
      }
    }
    let mask = zone.slice();
    for (let left = mask.reduce((n, v) => n + v, 0), pass = 0; left > 0 && pass < 80; pass++) {
      const next = mask.slice();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!mask[y * w + x]) continue;
        let n = 0, r = 0, gr = 0, b = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy, xx = x + dx;
          if (yy < 0 || yy >= h || xx < 0 || xx >= w || mask[yy * w + xx]) continue;
          const i = ((y1 + yy) * W + x1 + xx) * 3;
          n++; r += px[i]; gr += px[i + 1]; b += px[i + 2];
        }
        if (n < 2) continue;
        const i = ((y1 + y) * W + x1 + x) * 3;
        px[i] = r / n; px[i + 1] = gr / n; px[i + 2] = b / n;
        next[y * w + x] = 0; left--;
      }
      mask = next;
    }
    const TW = 190, tile = { left: 1300, top: y1, width: TW, height: h };
    const net = await sharp(join(PUBLIC, "products/cri-02.webp")).extract(tile).greyscale().raw().toBuffer();
    const flou = await sharp(join(PUBLIC, "products/cri-02.webp")).extract(tile).greyscale().blur(5).raw().toBuffer();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!zone[y * w + x]) continue;
      const k = x % (2 * TW), tx = k < TW ? k : 2 * TW - 1 - k;   // la bande est répétée en miroir
      const d = net[y * TW + tx] - flou[y * TW + tx], i = ((y1 + y) * W + x1 + x) * 3;
      for (let c = 0; c < 3; c++) px[i + c] = Math.max(0, Math.min(255, px[i + c] + d));
    }
    // 2. Poser le nouveau texte : chaque pixel de la photo va lire l'étiquette à plat là où le cylindre le place
    //    (9 lectures par pixel pour un tracé lisse), et le texte assombrit le papier comme une encre.
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = 0;
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
        const PX = x1 + x + (sx + 0.5) / 3 - 0.5, PY = y1 + y + (sy + 0.5) / 3 - 0.5;
        const lx = DOS.uc + Math.asin(Math.max(-1, Math.min(1, (PX - DOS.cx) / DOS.r))) / DOS.a, ly = (PY - DOS.y0) / DOS.s;
        v += (lx < zx || lx > zx + zw || ly < zy || ly > zy + zh) ? 255 : sample(lx, ly);
      }
      const t = Math.max(0, Math.min(1, (v / 9 - 24) / (222 - 24)));   // 0 = encre, 1 = papier
      if (t >= 1) continue;
      const f = ENCRE_MIN + (1 - ENCRE_MIN) * t, i = ((y1 + y) * W + x1 + x) * 3;
      px[i] *= f; px[i + 1] *= f; px[i + 2] *= f;
    }
  }
  await sharp(px, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 90 }).toFile(outFile);
}

async function main() {
  const arg = process.argv[2];
  const dir = mkdtempSync(join(tmpdir(), "gout-visuels-"));
  try {
    if (arg === "reperes") {
      // Contrôle des coins : le contour attendu, en rouge, sur chaque photo (dans le dossier temporaire donné en 2ᵉ argument)
      for (const [i, photo] of PHOTOS.entries()) await pastilleSurPhoto(photo, null, join(resolve(process.argv[3]), `repere-${i}.webp`), dir);
      return;
    }
    mkdirSync(join(PUBLIC, "gouts"), { recursive: true });
    mkdirSync(join(PUBLIC, "models"), { recursive: true });
    // Fruits rouges : la vignette vient de la pastille d'origine, l'étiquette allégée de l'étiquette d'origine
    if (!arg) {
      await sharp(join(SRC, "face.jpg")).extract({ left: 2084, top: 1429, width: 136, height: 136 }).resize(160, 160).webp({ quality: 88 }).toFile(join(PUBLIC, "gouts/fruits-rouges.webp"));
      await sharp(join(TEX, "wrap.jpg")).resize({ width: 3072 }).jpeg({ quality: 80 }).toFile(join(PUBLIC, "models/etiquette-fruits-rouges.jpg"));
    }
    for (const g of GOUTS.filter((x) => !arg || x.slug === arg)) {
      for (const photo of PHOTOS) {
        const done = await pastilleSurPhoto(photo, g, join(PUBLIC, photo.out(g.slug)), dir);
        if (photo.mini) await sharp(done).resize({ width: 200 }).webp({ quality: 90 }).toFile(join(PUBLIC, photo.mini(g.slug)));
      }
      await dosSurPhoto(g, join(PUBLIC, `products/cri-${g.slug}-02.webp`));
      const [px, py] = g.photo.split(" ").map((v) => parseFloat(v) / 100);
      const meta = await sharp(join(SRC, "gouts", `${g.slug}.jpg`)).metadata();
      const side = Math.min(meta.width, meta.height);
      await sharp(join(SRC, "gouts", `${g.slug}.jpg`))
        .extract({ left: Math.round((meta.width - side) * px), top: Math.round((meta.height - side) * py), width: side, height: side })
        .resize(160, 160).webp({ quality: 88 }).toFile(join(PUBLIC, `gouts/${g.slug}.webp`));
      await sharp(join(TEX, `wrap-${g.slug}.jpg`)).resize({ width: 3072 }).jpeg({ quality: 80 }).toFile(join(PUBLIC, `models/etiquette-${g.slug}.jpg`));
      console.log("✓", g.slug);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

await main();
