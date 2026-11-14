/**
 * Produit les visuels du pot pour le site, pour chaque goût, à partir des
 * photos d'origine (docs/3d/sources/photos/ et sources/accueil/ : goût fruits
 * rouges, ancienne formule, pastille de goût avec photo). Sur chaque image,
 * seul ce qui change est refait ; le reste n'est pas touché, et rien n'est
 * généré.
 *   - la ligne de dosages est effacée et recomposée ;
 *   - la pastille de goût est effacée (le papier est reconstitué) et le nom
 *     du goût imprimé à sa place, dans sa couleur et dans la même perspective ;
 *   - dos du pot : l'ancienne étiquette est effacée et la nouvelle
 *     (dos-<goût>.jpg) posée à sa place, avec la courbure du pot ;
 *   - étiquette allégée de chaque goût pour la visionneuse 3D.
 *
 *   node scripts/3d/gouts-visuels.mjs            # tout
 *   node scripts/3d/gouts-visuels.mjs ice-tea-peche   # les visuels d'un goût
 *
 * À lancer après scripts/3d/gouts.mjs (il lit docs/3d/textures/dos-<goût>.jpg
 * et wrap-<goût>.jpg). Les images sortent dans public/cri/<version>/, la
 * version étant celle de cri-formule.json : quand l'étiquette change, on
 * change de version, donc d'adresse, et aucun cache ne ressert l'ancienne image.
 *
 * Ajouter une image : la poser dans sources/accueil/, relever à la loupe l'axe
 * de sa ligne de dosages et les quatre coins de sa pastille, l'inscrire dans
 * ACCUEIL. Une image générée s'ajoute de la même façon : ses textes sont
 * refaits ici, ils sont donc exacts.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { COUVERCLE, FORMULE, GOUTS, LIGNE, LIGNE_ORIGINE, MENTIONS_ZONE, SRC, marque, mentions } from "./gouts.mjs";
import { dilater, ecrire, effacer, lire, masqueEncre, remplacerLigne, remplacerLigneCourbe, remplacerPastille } from "./retouche.mjs";

const PUBLIC = resolve("public");
const TEX = resolve("docs/3d/textures");
const PHOTOS = join(SRC, "photos");
const OUT = join(PUBLIC, "cri", FORMULE.version);

/**
 * Ce qu'il faut savoir d'une image pour la retoucher, relevé à la loupe :
 * `ligne` : l'axe de la ligne de dosages (son début, en bas, et sa fin) et la
 *   demi-largeur où chercher son encre ; `bout` et `tenir` : voir retouche.mjs.
 * `pastille` : les quatre coins de la pastille de goût d'origine (haut-gauche,
 *   haut-droit, bas-droit, bas-gauche) et `papier`, la première rangée de
 *   papier vierge sous elle avec la hauteur de bande utilisable.
 */
const FACES = [
  {
    src: "face.webp",
    nom: "face",
    ligne: { axe: [[1247.5, 1332], [1247.5, 433]], demi: 14 },
    pastille: { coins: [[787.5, 1375], [1061.5, 1375], [1061.5, 1481.5], [787.5, 1481.5]], papier: { y: 1489, h: 40 } },
  },
  {
    src: "detoure.webp",
    nom: "detoure",
    ligne: { axe: [[872.5, 902], [870.5, 265]], demi: 11 },
    pastille: { coins: [[547, 934], [738, 934], [738, 1011], [547, 1011]], papier: { y: 1018, h: 30 } },
    mini: true,
  },
  {
    src: "ambiance.webp",
    nom: "ambiance",
    ligne: { axe: [[1376, 1757], [1302.5, 1070]], demi: 16 },
    pastille: { coins: [[999, 1777], [1233, 1770.5], [1237.5, 1856.5], [1003, 1872.5]], papier: { y: 1876, h: 24 } },
  },
];

/**
 * Les images de l'accueil (hero, slider du bas), dans sources/accueil/. Le
 * pot y est toujours celui du goût d'origine. `tenir` partout : la nouvelle
 * ligne tient dans la longueur de l'ancienne, le strap est tout près.
 *
 * `generee` : image produite par un générateur. Le pot y est fidèle, mais ses
 * petits textes sortent approximatifs : la ligne de dosages, le nom du goût et
 * la phrase du couvercle (`couvercle` : trois points de sa ligne de base et la
 * hauteur de ses capitales) sont toujours réimprimés, les mentions aussi si
 * `mentions` est vrai. `largeur` : la largeur de l'image livrée au site.
 */
const ACCUEIL = {
  "hero-16x9": {
    ligne: { axe: [[1896, 1010], [1896, 440]], demi: 9 },
    pastille: { coins: [[1629, 1034.5], [1804.5, 1034.5], [1804.5, 1115], [1629, 1115]], papier: { y: 1122, h: 40 } },
  },
  "hero-9x16": {
    ligne: { axe: [[1050.5, 2048], [1035.5, 1462]], demi: 11 },
    pastille: { coins: [[763.5, 2068.5], [940.5, 2068], [941, 2140.5], [764, 2140.5]], papier: { y: 2147, h: 40 } },
  },
  // Générée le 2026-11-14 (cadrage plus large que la première version, où le pot était trop grand).
  "hero-2-16x9": {
    generee: true,
    largeur: 2880,
    couvercle: { points: [[2596, 735], [2999, 714], [3384, 728]], cap: 14 },
    ligne: { axe: [[3377.5, 1565], [3377.5, 952.5]], demi: 13 },
    pastille: { coins: [[2999.9, 1575.6], [3224.1, 1575.6], [3224.1, 1661.9], [2999.9, 1661.9]], papier: { y: 1668, h: 30 }, depuis: 125 },
  },
  "hero-2-9x16": {
    ligne: { axe: [[887.5, 1565], [887.5, 1042]], demi: 11 },
    pastille: { coins: [[611, 1593.5], [775, 1593.5], [775, 1658.5], [611, 1658.5]], papier: { y: 1665, h: 36 } },
  },
  "section3-dose-16x9": {
    ligne: { axe: [[2072.5, 1313], [2072.5, 760]], demi: 14 },
    pastille: { coins: [[1780.5, 1302], [1951, 1299.3], [1951, 1372.5], [1780.5, 1374.5]], papier: { y: 1381, h: 40 } },
  },
  "section3-dose-4x5": {
    ligne: { axe: [[1057, 1225], [1057, 846]], demi: 8, bout: 2 },   // le strap commence 6 px après la fin de la ligne
    pastille: { coins: [[868.5, 1216.5], [980.5, 1216.5], [980.5, 1268], [868.5, 1268]], papier: { y: 1273, h: 22 } },
  },
};
/** L'image de partage du lien (Open Graph, Twitter) : même pot, en tout petit. */
const PARTAGE = {
  ligne: { axe: [[1032, 495], [1032, 180]], demi: 6, bout: 2 },
  pastille: { coins: [[889, 509], [984, 509], [984, 553], [889, 553]], papier: { y: 557, h: 14 } },
};

/** Une image d'origine avec la ligne de dosages de la formule ; le goût reste à marquer. */
async function avecLigne(path, ligne, dir, tenir = false) {
  const img = await lire(path);
  if (LIGNE !== LIGNE_ORIGINE) await remplacerLigne(img, { ...ligne, tenir }, { ancien: LIGNE_ORIGINE, nouveau: LIGNE }, dir);
  return img;
}
const copie = (img) => ({ ...img, data: Buffer.from(img.data) });

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
    mkdirSync(join(PUBLIC, "models"), { recursive: true });
    // Les versions précédentes ne servent plus.
    for (const d of readdirSync(join(PUBLIC, "cri"))) if (d !== FORMULE.version) rmSync(join(PUBLIC, "cri", d), { recursive: true, force: true });
    // Le catalogue de test suit : ses images (JSON-LD, panier) pointent sur la version en cours.
    const mock = join(PUBLIC, "..", "docs/mock/catalogue.json");
    writeFileSync(mock, readFileSync(mock, "utf8").replace(/\/cri\/f\d+\//g, `/cri/${FORMULE.version}/`));

    if (!arg) {
      // Les images de l'accueil : la ligne de dosages et le marquage du goût d'origine.
      const origine = GOUTS[0];
      for (const [nom, cfg] of Object.entries(ACCUEIL)) {
        const src = join(SRC, "accueil", `${nom}.webp`);
        if (!existsSync(src)) { console.log("— absent :", nom); continue; }
        const img = await lire(src);
        if (cfg.couvercle) await remplacerLigneCourbe(img, cfg.couvercle, COUVERCLE, dir);
        if (cfg.ligne && (cfg.generee || LIGNE !== LIGNE_ORIGINE)) await remplacerLigne(img, { ...cfg.ligne, tenir: true }, { ancien: LIGNE_ORIGINE, nouveau: LIGNE }, dir);
        if (cfg.pastille) await remplacerPastille(img, cfg.pastille, marque(origine), dir);
        if (cfg.mentions) await remplacerPastille(img, { ...cfg.pastille, zone: MENTIONS_ZONE }, mentions(), dir, 0.2);
        let out = sharp(img.data, { raw: { width: img.width, height: img.height, channels: 3 } });
        if (cfg.largeur && cfg.largeur < img.width) out = out.resize({ width: cfg.largeur });
        await out.webp({ quality: 84 }).toFile(join(OUT, `${nom}.webp`));
      }
      // Les trois pots sur fond blanc (slide du bas) : rendus du modèle 3D par render_trio.py, posés sur du blanc.
      for (const nom of ["trio-16x9", "trio-4x5"]) await sharp(resolve("docs/3d/renders", `${nom}.jpg`)).webp({ quality: 88 }).toFile(join(OUT, `${nom}.webp`));
      const partage = await avecLigne(join(SRC, "accueil", "partage.jpg"), PARTAGE.ligne, dir, true);
      await remplacerPastille(partage, PARTAGE.pastille, marque(origine), dir);
      for (const nom of ["opengraph-image.jpg", "twitter-image.jpg"]) await ecrire(partage, resolve("src/app", nom), { quality: 90 });
      console.log("✓ accueil");
    }

    // Les photos de face avec la ligne de dosages de la formule : une fois pour tous les goûts.
    const bases = [];
    for (const photo of FACES) {
      const img = await avecLigne(join(PHOTOS, photo.src), photo.ligne, dir);
      // Le pot détouré garde sa transparence d'origine.
      const meta = await sharp(join(PHOTOS, photo.src)).metadata();
      const alpha = meta.hasAlpha ? await sharp(join(PHOTOS, photo.src)).extractChannel("alpha").toBuffer() : null;
      bases.push({ photo, img, alpha });
    }

    for (const g of GOUTS.filter((x) => !arg || x.slug === arg)) {
      for (const { photo, img, alpha } of bases) {
        const face = copie(img);
        await remplacerPastille(face, photo.pastille, marque(g), dir);
        let out = sharp(face.data, { raw: { width: face.width, height: face.height, channels: 3 } });
        if (alpha) out = out.joinChannel(alpha);
        const png = await out.png().toBuffer();
        await sharp(png).webp({ quality: 90 }).toFile(join(OUT, `${g.slug}-${photo.nom}.webp`));
        if (photo.mini) await sharp(png).resize({ width: 200 }).webp({ quality: 90 }).toFile(join(OUT, `${g.slug}-mini.webp`));
      }
      await dosSurPhoto(g, join(OUT, `${g.slug}-dos.webp`));
      await sharp(join(TEX, `wrap-${g.slug}.jpg`)).resize({ width: 3072 }).jpeg({ quality: 80 }).toFile(join(PUBLIC, `models/etiquette-${g.slug}.jpg`));
      console.log("✓", g.slug);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

await main();
