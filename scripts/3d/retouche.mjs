/**
 * Retouches de texte sur une image, sans génération : effacer une encre
 * imprimée sur le papier du pot, et reposer un texte composé en vraie police
 * au même endroit, dans la même perspective. Sert aux étiquettes (gouts.mjs)
 * et aux photos du site (gouts-visuels.mjs).
 *
 * Les images sont des tampons bruts RGB : { data, width, height }.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";

export const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const file = (p) => `file://${p}`;
const FONTS = resolve("src/fonts");
export const JBM = `@font-face{font-family:JBM;src:url('${file(join(FONTS, "jetbrains-mono-latin-wght-normal.woff2"))}');font-weight:100 800}`;

/** Capture une page HTML de la taille donnée (Chrome sans interface). */
export function shoot(html, width, height, out, dir) {
  const page = join(dir, "page.html");
  writeFileSync(page, html);
  execFileSync(CHROME, [
    "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1", "--allow-file-access-from-files",
    `--user-data-dir=${join(dir, "profil")}`, "--virtual-time-budget=4000",
    `--window-size=${width},${height}`, `--screenshot=${out}`, file(page),
  ], { stdio: "ignore" });
}

export async function lire(path) {
  const { data, info } = await sharp(path).flatten({ background: "#1238c7" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

const lum = (img, i) => 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];

/** Homographie qui envoie le rectangle (0,0)-(w,h) sur quatre points, en `matrix3d` CSS. */
export function matrix3d(w, h, dst) {
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

/**
 * Le masque de l'encre dans un rectangle { x, y, w, h } : les pixels nettement
 * plus sombres que le papier autour d'eux (`seuil` × la clarté locale), ou
 * colorés (filets bleus, texte rouge) si `couleurs` est vrai. `sombre` : en
 * dessous de cette clarté, c'est de l'encre quoi qu'il y ait autour (aplats).
 */
export function masqueEncre(img, rect, { seuil = 0.72, couleurs = false, sombre = 0 } = {}) {
  const { x, y, w, h } = rect, W = img.width;
  const L = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) L[j * w + i] = lum(img, ((y + j) * W + x + i) * 3);
  // clarté du papier : le maximum local (l'encre est fine, le papier domine), en deux passes séparables
  const R = 9, tmp = new Float32Array(w * h), fond = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let m = 0; for (let k = Math.max(0, i - R); k <= Math.min(w - 1, i + R); k++) m = Math.max(m, L[j * w + k]); tmp[j * w + i] = m; }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let m = 0; for (let k = Math.max(0, j - R); k <= Math.min(h - 1, j + R); k++) m = Math.max(m, tmp[k * w + i]); fond[j * w + i] = m; }
  const mask = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const p = ((y + j) * W + x + i) * 3, r = img.data[p], g = img.data[p + 1], b = img.data[p + 2];
    if (L[j * w + i] < seuil * fond[j * w + i] || L[j * w + i] < sombre || (couleurs && (b > r + 28 || r > g + 45))) mask[j * w + i] = 1;
  }
  return mask;
}

export function dilater(mask, w, h, r) {
  const out = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!mask[j * w + i]) continue;
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      const jj = j + dj, ii = i + di;
      if (jj >= 0 && jj < h && ii >= 0 && ii < w) out[jj * w + ii] = 1;
    }
  }
  return out;
}

/**
 * Efface l'encre d'un rectangle : les pixels du masque sont rebouchés de
 * proche en proche avec la moyenne de leurs voisins de papier (la clarté du
 * papier, lisse), puis on leur rend un grain : celui de `detail(i, j)` s'il est
 * donné (le détail fin d'un vrai morceau de papier), sinon un bruit de la
 * force mesurée sur le papier voisin.
 */
export function effacer(img, rect, zone, detail = null) {
  const { x, y, w, h } = rect, W = img.width, px = img.data;
  let mask = zone.slice();
  for (let left = mask.reduce((n, v) => n + v, 0), pass = 0; left > 0 && pass < 200; pass++) {
    const next = mask.slice();
    let done = 0;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (!mask[j * w + i]) continue;
      let n = 0, r = 0, g = 0, b = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const jj = j + dj, ii = i + di;
        if (jj < 0 || jj >= h || ii < 0 || ii >= w || mask[jj * w + ii]) continue;
        const p = ((y + jj) * W + x + ii) * 3;
        n++; r += px[p]; g += px[p + 1]; b += px[p + 2];
      }
      if (n < 2) continue;
      const p = ((y + j) * W + x + i) * 3;
      px[p] = r / n; px[p + 1] = g / n; px[p + 2] = b / n;
      next[j * w + i] = 0; done++;
    }
    left -= done;
    mask = next;
    if (!done) break;
  }
  if (detail) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (!zone[j * w + i]) continue;
      const d = detail(i, j), p = ((y + j) * W + x + i) * 3;
      for (let c = 0; c < 3; c++) px[p + c] = Math.max(0, Math.min(255, px[p + c] + d));
    }
    return;
  }
  // Le grain : écart-type des différences entre voisins de papier, rendu par un bruit de même force.
  let s = 0, n = 0;
  for (let j = 1; j < h; j++) for (let i = 1; i < w; i++) {
    if (zone[j * w + i] || zone[j * w + i - 1] || zone[(j - 1) * w + i]) continue;
    const p = ((y + j) * W + x + i) * 3, q = p - 3;
    s += (px[p + 1] - px[q + 1]) ** 2; n++;
  }
  const force = n ? Math.sqrt(s / n) * 0.7 : 3;
  let seed = 12345;
  const alea = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const bruit = new Float32Array(w * h);
  for (let k = 0; k < bruit.length; k++) bruit[k] = (alea() + alea() + alea() - 1.5) * 2 * force;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!zone[j * w + i]) continue;
    // bruit adouci sur 2 pixels : le grain du papier n'est pas du sel
    const d = (bruit[j * w + i] + bruit[j * w + Math.min(w - 1, i + 1)] + bruit[Math.min(h - 1, j + 1) * w + i]) / 1.8;
    const p = ((y + j) * W + x + i) * 3;
    for (let c = 0; c < 3; c++) px[p + c] = Math.max(0, Math.min(255, px[p + c] + d));
  }
}

/**
 * Pose sur l'image une couche rendue par Chrome (encre sombre sur fond blanc,
 * fichier PNG de la taille du rectangle) : elle assombrit le papier comme une
 * encre. `encreMin` : part de clarté que garde le noir le plus dense.
 */
export async function encrer(img, rect, pngPath, encreMin = 0.2) {
  const { x, y, w, h } = rect, W = img.width, px = img.data;
  const layer = await sharp(pngPath).extract({ left: 0, top: 0, width: w, height: h }).removeAlpha().raw().toBuffer();
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const p = ((y + j) * W + x + i) * 3, q = (j * w + i) * 3;
    for (let c = 0; c < 3; c++) {
      const t = layer[q + c] / 255;
      if (t < 0.995) px[p + c] *= encreMin + (1 - encreMin) * t;
    }
  }
}

/**
 * Remplace une ligne de texte (la ligne de dosages du pot, lue de bas en haut)
 * par une autre. `axe` : deux points au milieu de la ligne, son début et sa
 * fin, relevés à quelques pixels près ; `demi` : la demi-largeur de la bande
 * où chercher l'encre (assez pour les lettres, pas assez pour toucher ce qui
 * les entoure). Les deux bords de l'ancien texte sont ajustés en droites, ce
 * qui donne sa boîte, perspective comprise. Le nouveau texte est composé dans
 * cette boîte, au même pas de lettre (`ancien` sert à le mesurer), centré sur
 * l'ancien. `bout` : de combien l'encre peut dépasser les deux points de l'axe
 * (à réduire quand autre chose de sombre touche presque la ligne).
 * `graisse` : celle de JetBrains Mono.
 */
export async function remplacerLigne(img, { axe, demi, tenir = false, bout = 14 }, { ancien, nouveau, graisse = 600, encreMin = 0.22, seuil = 0.72 }, dir) {
  const [[xs, ys], [xe, ye]] = axe;
  const len = Math.hypot(xe - xs, ye - ys), u = [(xe - xs) / len, (ye - ys) / len], n = [-u[1], u[0]]; // n : vers la ligne de base
  const marge = 14;
  const x = Math.max(0, Math.floor(Math.min(xs, xe) - demi - marge)), y = Math.max(0, Math.floor(Math.min(ys, ye) - demi - marge));
  const w = Math.min(img.width - x, Math.ceil(Math.abs(xe - xs) + 2 * (demi + marge))), h = Math.min(img.height - y, Math.ceil(Math.abs(ye - ys) + 2 * (demi + marge)));
  const rect = { x, y, w, h };
  const encre = masqueEncre(img, rect, { seuil });
  // Coordonnées de chaque pixel d'encre le long de l'axe (s) et en travers (d) ; hors de la bande, ce n'est pas la ligne.
  const bins = new Map();
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!encre[j * w + i]) continue;
    const px = x + i - xs, py = y + j - ys, s = px * u[0] + py * u[1], d = px * n[0] + py * n[1];
    if (Math.abs(d) > demi || s < -bout || s > len + bout) { encre[j * w + i] = 0; continue; }
    const k = Math.round(s), bin = bins.get(k);
    if (!bin) bins.set(k, [d, d]); else { if (d < bin[0]) bin[0] = d; if (d > bin[1]) bin[1] = d; }
  }
  const rows = [...bins].map(([k, [a, b]]) => [k, a, b]).sort((p, q) => p[0] - q[0]);
  if (rows.length < 20) throw new Error("ligne introuvable sur l'axe donné");
  const widths = rows.map((r) => r[2] - r[1]).sort((p, q) => p - q);
  const med = widths[Math.floor(widths.length * 0.6)];
  const full = rows.filter((r) => r[2] - r[1] >= med * 0.85 && r[2] - r[1] <= med * 1.08);
  const fit = (k) => {
    const m = full.length, ms = full.reduce((t, r) => t + r[0], 0) / m, mv = full.reduce((t, r) => t + r[k], 0) / m;
    const b = full.reduce((t, r) => t + (r[0] - ms) * (r[k] - mv), 0) / full.reduce((t, r) => t + (r[0] - ms) ** 2, 0);
    return (v) => mv + b * (v - ms);
  };
  const haut = fit(1), base = fit(2);
  const s0 = rows[0][0] - 0.5, s1 = rows[rows.length - 1][0] + 0.5;
  const P = (s, d) => [xs + u[0] * s + n[0] * d, ys + u[1] * s + n[1] * d];
  const coins = [P(s0, haut(s0) - 0.5), P(s1, haut(s1) - 0.5), P(s1, base(s1) + 0.5), P(s0, base(s0) + 0.5)];

  effacer(img, rect, dilater(encre, w, h, 2));

  // Boîte locale : hauteur de capitale 100, longueur à l'échelle ; SVG pour poser la ligne de base au pixel.
  const cap = ((base(s0) - haut(s0)) + (base(s1) - haut(s1))) / 2 + 1;
  const H = 100, L = ((s1 - s0) / cap) * H, fs = H / 0.73;
  // `tenir` : le nouveau texte tient dans la longueur de l'ancien (un rien plus serré) — quand la place manque au bout.
  const largeur = tenir ? L : (L / ancien.length) * nouveau.length, x0 = (L - largeur) / 2;
  const local = coins.map(([cx, cy]) => [cx - x, cy - y]);
  const html = `<!doctype html><meta charset="utf-8"><style>${JBM}html,body{margin:0;background:#fff}
#c{position:relative;width:${w}px;height:${h}px;overflow:hidden}
#t{position:absolute;left:0;top:0;width:${L}px;height:${H}px;transform-origin:0 0;transform:${matrix3d(L, H, local)}}
svg{position:absolute;left:0;top:0;overflow:visible}
text{font-family:JBM;font-weight:${graisse};font-size:${fs}px;fill:#000}
</style><div id="c"><div id="t"><svg width="${L}" height="${H}" viewBox="0 0 ${L} ${H}"><text x="${x0}" y="${H}" textLength="${largeur}" lengthAdjust="spacingAndGlyphs">${nouveau}</text></svg></div></div>`;
  const png = join(dir, "ligne.png");
  shoot(html, Math.max(w, 500), Math.max(h, 400), png, dir);
  await encrer(img, rect, png, encreMin);
  return coins;
}

export async function ecrire(img, path, options = {}) {
  const s = sharp(img.data, { raw: { width: img.width, height: img.height, channels: 3 } });
  if (path.endsWith(".webp")) await s.webp({ quality: 90, ...options }).toFile(path);
  else if (path.endsWith(".png")) await s.png().toFile(path);
  else await s.jpeg({ quality: 94, ...options }).toFile(path);
}
