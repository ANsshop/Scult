/**
 * Produit les visuels du pot pour le site, pour chaque goût, à partir des
 * photos d'origine (docs/3d/sources/photos/, goût fruits rouges, ancienne
 * formule). Sur chaque photo, seul ce qui change est refait ; le reste de
 * l'image n'est pas touché, et rien n'est généré.
 *   - face, pot détouré, photo d'ambiance : la ligne de dosages est effacée
 *     et recomposée ; pour un autre goût, l'ancienne pastille est recouverte
 *     de papier (pris juste dessous, sur la même photo) et la nouvelle posée
 *     au même endroit, dans la même perspective ;
 *   - dos : l'ancienne étiquette est effacée et la nouvelle (dos-<goût>.jpg)
 *     posée à sa place, avec la courbure du pot ;
 *   - images de l'accueil (hero, slider du bas) : la ligne de dosages ;
 *   - vignettes des sélecteurs de goût, et étiquette allégée de chaque goût
 *     pour la visionneuse 3D.
 *
 *   node scripts/3d/gouts-visuels.mjs            # tous les goûts
 *   node scripts/3d/gouts-visuels.mjs ice-tea-peche
 *
 * À lancer après scripts/3d/gouts.mjs (il lit docs/3d/textures/dos-<goût>.jpg
 * et wrap-<goût>.jpg). Les photos sortent dans public/cri/<version>/, la
 * version étant celle de cri-formule.json : quand la formule change, on
 * change de version, donc d'adresse, et aucun cache ne ressert l'ancienne image.
 */
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { FORMULE, GOUTS, LIGNE, LIGNE_ORIGINE, SRC, fonts, pastilleCss, pastilleHtml } from "./gouts.mjs";
import { dilater, ecrire, effacer, file, lire, masqueEncre, matrix3d, remplacerLigne, shoot } from "./retouche.mjs";

const PUBLIC = resolve("public");
const TEX = resolve("docs/3d/textures");
const PHOTOS = join(SRC, "photos");
const OUT = join(PUBLIC, "cri", FORMULE.version);

/**
 * Les photos où l'on voit la face du pot. `ligne` : l'axe de la ligne de
 * dosages (son début, en bas, et sa fin) et la demi-largeur où chercher son
 * encre. `coins` : les quatre coins de la pastille de goût (haut-gauche,
 * haut-droit, bas-droit, bas-gauche). `papier` : la première rangée de papier
 * vierge sous la pastille et la hauteur de la bande utilisable, pour
 * recouvrir l'ancienne. Tout est relevé à la loupe sur la photo.
 */
const FACES = [
  {
    src: "face.webp",
    nom: "face",
    ligne: { axe: [[1247.5, 1332], [1247.5, 433]], demi: 14 },
    coins: [[787.5, 1375], [1061.5, 1375], [1061.5, 1481.5], [787.5, 1481.5]],
    papier: { y: 1489, h: 40 },
  },
  {
    src: "detoure.webp",
    nom: "detoure",
    ligne: { axe: [[872.5, 902], [870.5, 265]], demi: 11 },
    coins: [[547, 934], [738, 934], [738, 1011], [547, 1011]],
    papier: { y: 1018, h: 30 },
    mini: true,
  },
  {
    src: "ambiance.webp",
    nom: "ambiance",
    ligne: { axe: [[1376, 1757], [1302.5, 1070]], demi: 16 },
    coins: [[999, 1777], [1233, 1770.5], [1237.5, 1856.5], [1003, 1872.5]],
    papier: { y: 1876, h: 24 },
  },
];

/**
 * Les images de l'accueil où la ligne de dosages se lit (hero, slider du bas),
 * dans docs/3d/sources/accueil/. Même relevé que ci-dessus ; `tenir` : la
 * nouvelle ligne tient dans la longueur de l'ancienne, le strap est tout près.
 */
const ACCUEIL = {
  "hero-16x9": { axe: [[1896, 1010], [1896, 440]], demi: 9 },
  "hero-9x16": { axe: [[1050.5, 2048], [1035.5, 1462]], demi: 11 },
  "hero-2-16x9": { axe: [[1870, 840], [1870, 335]], demi: 9 },
  "hero-2-9x16": { axe: [[887.5, 1565], [887.5, 1042]], demi: 11 },
  "section3-dose-16x9": { axe: [[2072.5, 1313], [2072.5, 760]], demi: 14 },
  "section3-dose-4x5": { axe: [[1057, 1225], [1057, 846]], demi: 8, bout: 2 },   // le strap commence 6 px après la fin de la ligne
  "section3-barre-4x5": { axe: [[1101, 1233], [1101, 830]], demi: 10 },
};

/** Pose la pastille du goût sur une photo (fichier PNG opaque) et rend l'image complète, en tampon PNG. */
async function pastilleSurPhoto(photo, g, basePng, dir) {
  const meta = await sharp(basePng).metadata();
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
    `<div style="position:absolute;left:0;width:100%;top:${i * hb}px;height:${hb + 0.5}px;background:url('${file(basePng)}') no-repeat;background-size:${meta.width * k}px ${meta.height * k}px;background-position:${-(box.l * k - m)}px ${-(photo.papier.y * k)}px;transform:scaleY(${i % 2 ? -1 : 1})"></div>`).join("");
  const local = photo.coins.map(([x, y]) => [x - R.l, y - R.t]);
  const html = `<!doctype html><meta charset="utf-8"><style>${fonts}
#c{position:relative;width:${R.w}px;height:${R.h}px;overflow:hidden;background:url('${file(basePng)}') ${-R.l}px ${-R.t}px/${meta.width}px ${meta.height}px no-repeat}
#t{position:absolute;left:0;top:0;width:390px;height:150px;transform-origin:0 0;transform:${matrix3d(390, 150, local)}}
#cache{position:absolute;left:${-m}px;top:${-m}px;width:${390 + 2 * m}px;height:${150 + 2 * m}px;overflow:hidden;border-radius:${50 + m}px;
  -webkit-mask-image:linear-gradient(to right,transparent 0,#000 7px,#000 calc(100% - 7px),transparent 100%),linear-gradient(to bottom,transparent 0,#000 7px,#000 calc(100% - 7px),transparent 100%);
  -webkit-mask-composite:source-in;mask-composite:intersect}
.pastille{left:0;top:0}
${pastilleCss(g)}
</style><div id="c"><div id="t"><div id="cache">${strips}</div>${pastilleHtml(g)}</div></div>`;
  const shotFile = join(dir, "shot.png");
  shoot(html, R.w, R.h, shotFile, dir);
  const patch = await sharp(shotFile).extract({ left: P.l - R.l, top: P.t - R.t, width: P.w, height: P.h }).removeAlpha().png().toBuffer();
  return sharp(basePng).composite([{ input: patch, left: P.l, top: P.t }]).png().toBuffer();
}

/**
 * Le dos du pot. L'étiquette à plat (1500 px de large) est posée sur la photo
 * en suivant le cylindre : X = CX + R·sin((x − UC)·A), Y = Y0 + S·y.
 * Coefficients ajustés sur 40 débuts de mots communs à l'étiquette d'origine
 * et à la photo (écart moyen : un tiers de pixel).
 */
const DOS = { cx: 830.5, r: 717.5, uc: 751.125, a: 0.000967, y0: 570.88, s: 0.6941 };
const DOS_ZONE = [50, 45, 1400, 2010];   // l'étiquette entière, en px de l'étiquette à plat (x, y, l, h)
const ENCRE_MIN = 0.2;                   // l'encre la plus noire garde 20 % de la clarté du papier, comme sur la photo d'origine

async function dosSurPhoto(g, outFile) {
  const src = join(PHOTOS, "dos.webp");
  const img = await lire(src);
  const label = await sharp(join(TEX, `dos-${g.slug}.jpg`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const LW = label.info.width, LH = label.info.height, lb = label.data, px = img.data, W = img.width;
  const fond = [lb[(40 * LW + 1450) * 3], lb[(40 * LW + 1450) * 3 + 1], lb[(40 * LW + 1450) * 3 + 2]];
  const X = (x) => DOS.cx + DOS.r * Math.sin((x - DOS.uc) * DOS.a);
  const [zx, zy, zw, zh] = DOS_ZONE;
  const rect = { x: Math.floor(X(zx)), y: Math.floor(DOS.y0 + DOS.s * zy) };
  rect.w = Math.ceil(X(zx + zw)) - rect.x;
  rect.h = Math.ceil(DOS.y0 + DOS.s * (zy + zh)) - rect.y;

  // 1. Effacer l'ancienne étiquette : textes, cartouches noirs, filets bleus, mention rouge. Le grain rendu
  //    au papier vient d'une bande vierge de la même photo, à droite de l'étiquette (mêmes rangées).
  const zone = dilater(masqueEncre(img, rect, { seuil: 0.9, sombre: 172, couleurs: true }), rect.w, rect.h, 3);
  const TW = 190, tile = { left: 1300, top: rect.y, width: TW, height: rect.h };
  const net = await sharp(src).extract(tile).greyscale().raw().toBuffer();
  const flou = await sharp(src).extract(tile).greyscale().blur(5).raw().toBuffer();
  effacer(img, rect, zone, (i, j) => {
    const k = i % (2 * TW), tx = k < TW ? k : 2 * TW - 1 - k;   // la bande est répétée en miroir
    return net[j * TW + tx] - flou[j * TW + tx];
  });

  // 2. Poser la nouvelle : chaque pixel de la photo va lire l'étiquette à plat là où le cylindre le place
  //    (9 lectures par pixel pour un tracé lisse), et l'étiquette teinte le papier comme une encre.
  const sample = (x, y, c) => {
    if (x < 0 || y < 0 || x >= LW - 1 || y >= LH - 1) return fond[c];
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, i = (yi * LW + xi) * 3 + c;
    return lb[i] * (1 - fx) * (1 - fy) + lb[i + 3] * fx * (1 - fy) + lb[i + LW * 3] * (1 - fx) * fy + lb[i + LW * 3 + 3] * fx * fy;
  };
  for (let j = 0; j < rect.h; j++) for (let i = 0; i < rect.w; i++) {
    const v = [0, 0, 0];
    for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
      const PX = rect.x + i + (sx + 0.5) / 3 - 0.5, PY = rect.y + j + (sy + 0.5) / 3 - 0.5;
      const lx = DOS.uc + Math.asin(Math.max(-1, Math.min(1, (PX - DOS.cx) / DOS.r))) / DOS.a, ly = (PY - DOS.y0) / DOS.s;
      const dehors = lx < zx || lx > zx + zw || ly < zy || ly > zy + zh;
      for (let c = 0; c < 3; c++) v[c] += dehors ? fond[c] : sample(lx, ly, c);
    }
    const p = ((rect.y + j) * W + rect.x + i) * 3;
    for (let c = 0; c < 3; c++) {
      const t = Math.max(0, Math.min(1, (v[c] / 9 - 20) / (fond[c] - 12 - 20)));   // 0 = encre, 1 = papier
      if (t < 1) px[p + c] *= ENCRE_MIN + (1 - ENCRE_MIN) * t;
    }
  }
  await ecrire(img, outFile);
}

async function main() {
  const arg = process.argv[2];
  const dir = mkdtempSync(join(tmpdir(), "gout-visuels-"));
  try {
    mkdirSync(OUT, { recursive: true });
    mkdirSync(join(PUBLIC, "gouts"), { recursive: true });
    mkdirSync(join(PUBLIC, "models"), { recursive: true });
    // Les versions précédentes ne servent plus.
    for (const d of readdirSync(join(PUBLIC, "cri"))) if (d !== FORMULE.version) rmSync(join(PUBLIC, "cri", d), { recursive: true, force: true });

    // Les photos de face avec la ligne de dosages de la formule : une fois pour tous les goûts.
    const bases = [];
    for (const photo of FACES) {
      const img = await lire(join(PHOTOS, photo.src));
      if (LIGNE !== LIGNE_ORIGINE) await remplacerLigne(img, photo.ligne, { ancien: LIGNE_ORIGINE, nouveau: LIGNE }, dir);
      const png = join(dir, `${photo.nom}.png`);
      await ecrire(img, png);
      // Le pot détouré garde sa transparence d'origine.
      const meta = await sharp(join(PHOTOS, photo.src)).metadata();
      const alpha = meta.hasAlpha ? await sharp(join(PHOTOS, photo.src)).extractChannel("alpha").toBuffer() : null;
      bases.push({ photo, png, alpha });
    }

    // Les images de l'accueil : seule la ligne de dosages change.
    if (!arg) {
      for (const [nom, ligne] of Object.entries(ACCUEIL)) {
        const img = await lire(join(SRC, "accueil", `${nom}.webp`));
        if (LIGNE !== LIGNE_ORIGINE) await remplacerLigne(img, { ...ligne, tenir: true }, { ancien: LIGNE_ORIGINE, nouveau: LIGNE }, dir);
        await ecrire(img, join(OUT, `${nom}.webp`), { quality: 84 });
      }
      // Les trois pots sur fond blanc (slide du bas) : rendus du modèle 3D par render_trio.py, posés sur du blanc.
      for (const nom of ["trio-16x9", "trio-4x5"]) await sharp(resolve("docs/3d/renders", `${nom}.jpg`)).webp({ quality: 88 }).toFile(join(OUT, `${nom}.webp`));
      // L'image de partage du lien (Open Graph, Twitter) : même pot, même ligne, en tout petit.
      const partage = await lire(join(SRC, "accueil", "partage.jpg"));
      if (LIGNE !== LIGNE_ORIGINE) await remplacerLigne(partage, { axe: [[1032, 495], [1032, 180]], demi: 6, tenir: true, bout: 2 }, { ancien: LIGNE_ORIGINE, nouveau: LIGNE }, dir);
      for (const nom of ["opengraph-image.jpg", "twitter-image.jpg"]) await ecrire(partage, resolve("src/app", nom), { quality: 90 });
      console.log("✓ accueil");
    }

    for (const g of GOUTS.filter((x) => !arg || x.slug === arg)) {
      for (const { photo, png, alpha } of bases) {
        const done = g.origine ? await sharp(png).png().toBuffer() : await pastilleSurPhoto(photo, g, png, dir);
        const out = alpha ? await sharp(done).removeAlpha().joinChannel(alpha).png().toBuffer() : done;
        await sharp(out).webp({ quality: 90 }).toFile(join(OUT, `${g.slug}-${photo.nom}.webp`));
        if (photo.mini) await sharp(out).resize({ width: 200 }).webp({ quality: 90 }).toFile(join(OUT, `${g.slug}-mini.webp`));
      }
      await dosSurPhoto(g, join(OUT, `${g.slug}-dos.webp`));

      // La vignette du sélecteur de goût : la photo de la pastille (celle d'origine est prise sur la face).
      const swatch = join(PUBLIC, `gouts/${g.slug}.webp`);
      if (g.origine) {
        await sharp(join(SRC, "face.jpg")).extract({ left: 2084, top: 1429, width: 136, height: 136 }).resize(160, 160).webp({ quality: 88 }).toFile(swatch);
      } else {
        const [px, py] = g.photo.split(" ").map((v) => parseFloat(v) / 100);
        const meta = await sharp(join(SRC, "gouts", `${g.slug}.jpg`)).metadata();
        const side = Math.min(meta.width, meta.height);
        await sharp(join(SRC, "gouts", `${g.slug}.jpg`))
          .extract({ left: Math.round((meta.width - side) * px), top: Math.round((meta.height - side) * py), width: side, height: side })
          .resize(160, 160).webp({ quality: 88 }).toFile(swatch);
      }
      await sharp(join(TEX, `wrap-${g.slug}.jpg`)).resize({ width: 3072 }).jpeg({ quality: 80 }).toFile(join(PUBLIC, `models/etiquette-${g.slug}.jpg`));
      console.log("✓", g.slug);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

await main();
