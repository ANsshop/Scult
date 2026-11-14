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
  const args = [
    "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1", "--allow-file-access-from-files",
    `--user-data-dir=${join(dir, "profil")}`, "--virtual-time-budget=4000",
    `--window-size=${width},${height}`, `--screenshot=${out}`, file(page),
  ];
  // Chrome sans interface échoue parfois au démarrage quand la machine est chargée : on réessaie.
  for (let essai = 1; ; essai++) {
    try { execFileSync(CHROME, args, { stdio: "ignore" }); return; }
    catch (err) { if (essai >= 4) throw err; }
  }
}

export async function lire(path) {
  const { data, info } = await sharp(path).flatten({ background: "#1238c7" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

const lum = (img, i) => 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];

/**
 * L'homographie qui envoie quatre points sur quatre autres : ses huit
 * coefficients [a, b, c, d, e, f, g, h], avec
 * u = (a·x + b·y + c) / (g·x + h·y + 1) et v = (d·x + e·y + f) / (g·x + h·y + 1).
 */
export function homographie(src, dst) {
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
  return A.map((row, k) => row[8] / row[k]);
}
export const projeter = ([a, b, c, d, e, f, g, h], x, y) => { const w = g * x + h * y + 1; return [(a * x + b * y + c) / w, (d * x + e * y + f) / w]; };

/** Homographie qui envoie le rectangle (0,0)-(w,h) sur quatre points, en `matrix3d` CSS. */
export function matrix3d(w, h, dst) {
  const [a, b, c, d, e, f, g, i] = homographie([[0, 0], [w, 0], [w, h], [0, h]], dst);
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
export function effacer(img, rect, zone, detail = null, lisser = 0) {
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
  // Grande zone : le rebouchage de proche en proche laisse des traînées. On les détend en laissant chaque
  // pixel de la zone tendre vers la moyenne de ses voisins, le papier autour restant fixe.
  for (let pass = 0; pass < lisser; pass++) {
    for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) {
      if (!zone[j * w + i]) continue;
      const p = ((y + j) * W + x + i) * 3;
      for (let c = 0; c < 3; c++) px[p + c] = (px[p + c - 3] + px[p + c + 3] + px[p + c - W * 3] + px[p + c + W * 3]) / 4;
    }
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

/**
 * Reconstitue le papier dans une grande zone (là où il y avait un aplat, une
 * photo) : chaque pixel prend la teinte du papier qui borde la zone, les bords
 * les plus proches comptant le plus, ce qui prolonge sans couture la lumière
 * de la photo. Les bords tachés d'encre sont écartés. `detail(i, j)` rend
 * ensuite son grain au papier.
 */
export function comblerPapier(img, rect, zone, detail) {
  const { x, y, w, h } = rect, W = img.width, px = img.data;
  // L'anneau : le papier à quelques pixels de la zone. Chaque point y prend la teinte moyenne du papier
  // autour de lui (rayon 6, hors zone) : sans cela, le grain du bord file en traînées dans la zone.
  //            L'encre voisine (un filet, une lettre, le bleu du logo) n'entre pas dans cette moyenne.
  const bord = dilater(zone, w, h, 1), pres = dilater(zone, w, h, 5);
  const encre = dilater(masqueEncre(img, rect, { seuil: 0.8, couleurs: true }), w, h, 2);
  const R = 6, ring = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!pres[j * w + i] || bord[j * w + i] || encre[j * w + i]) continue;
    let n = 0, r = 0, g = 0, b = 0;
    for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
      const jj = j + dj, ii = i + di;
      if (jj < 0 || jj >= h || ii < 0 || ii >= w || bord[jj * w + ii] || encre[jj * w + ii]) continue;
      const p = ((y + jj) * W + x + ii) * 3;
      n++; r += px[p]; g += px[p + 1]; b += px[p + 2];
    }
    if (n > R * R / 2) ring.push([i, j, r / n, g / n, b / n]);
  }
  // Un point de l'anneau nettement plus sombre que les autres est sur de l'encre (un filet, un dessin) : écarté.
  const clarte = (p) => 0.299 * p[2] + 0.587 * p[3] + 0.114 * p[4];
  const tri = ring.map(clarte).sort((p, q) => p - q), mediane = tri[Math.floor(tri.length / 2)];
  const propre = ring.filter((p) => clarte(p) > mediane * 0.8);
  // Le raccord : sur les 3 px du bord de la zone, le papier reconstitué se fond dans l'image.
  const d1 = dilater(Uint8Array.from(zone, (v) => 1 - v), w, h, 1), d2 = dilater(Uint8Array.from(zone, (v) => 1 - v), w, h, 2), d3 = dilater(Uint8Array.from(zone, (v) => 1 - v), w, h, 3);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = j * w + i;
    if (!zone[k]) continue;
    let sw = 0, r = 0, g = 0, b = 0;
    for (const [ri, rj, rr, rg, rb] of propre) {
      const d2c = (ri - i) ** 2 + (rj - j) ** 2 + 16, wgt = 1 / (d2c * d2c);
      sw += wgt; r += wgt * rr; g += wgt * rg; b += wgt * rb;
    }
    const d = detail ? detail(i, j) : 0, p = ((y + j) * W + x + i) * 3;
    const a = d1[k] ? 0.25 : d2[k] ? 0.5 : d3[k] ? 0.75 : 1;
    const v = [r / sw + d, g / sw + d, b / sw + d];
    for (let c = 0; c < 3; c++) px[p + c] = Math.max(0, Math.min(255, px[p + c] * (1 - a) + v[c] * a));
  }
}

/**
 * Remplace la pastille de goût d'une image par un simple marquage : la
 * pastille (cadre et photo) est effacée — le papier est reconstitué depuis ses
 * bords, avec le grain d'une bande de papier vierge prise juste dessous — puis
 * `svg` est imprimé à sa place, dans la même perspective.
 *
 * `coins` : les quatre coins de l'ancienne pastille (haut-gauche, haut-droit,
 * bas-droit, bas-gauche) ; elle mesure 390 × 150 dans son propre repère, celui
 * dans lequel `svg` est dessiné. `papier` : { y, h }, la première rangée de
 * papier vierge sous la pastille et la hauteur de bande utilisable.
 * `depuis` : n'efface qu'à partir de cette abscisse du repère de la pastille
 * (sur une image générée, où il n'y a pas de pastille mais un nom de goût à
 * remplacer, et où le logo bleu peut déborder dans la boîte).
 * `zone` : [x0, y0, x1, y1] dans le même repère, pour effacer et réimprimer un
 * autre bloc de l'étiquette (les mentions à droite du filet, par exemple).
 */
export async function remplacerPastille(img, { coins, papier, depuis = -Infinity, zone: boite = null }, svg, dir, encreMin = 0.16) {
  const W = img.width, px = img.data;
  const marge = 26;
  // Le rectangle de travail : la pastille, ou le bloc demandé, projeté dans l'image.
  const versImage = homographie([[0, 0], [390, 0], [390, 150], [0, 150]], coins);
  const cadre = boite ? [[boite[0], boite[1]], [boite[2], boite[1]], [boite[2], boite[3]], [boite[0], boite[3]]].map(([lx, ly]) => projeter(versImage, lx, ly)) : coins;
  const cx = cadre.map((p) => p[0]), cy = cadre.map((p) => p[1]);
  const x = Math.max(0, Math.floor(Math.min(...cx) - marge)), y = Math.max(0, Math.floor(Math.min(...cy) - marge));
  const w = Math.min(img.width - x, Math.ceil(Math.max(...cx) + marge) - x), h = Math.min(img.height - y, Math.ceil(Math.max(...cy) + marge) - y);
  const rect = { x, y, w, h };
  // La zone à effacer : le rectangle arrondi de la pastille, un peu débordé (le cadre a un halo).
  const local = [[0, 0], [390, 0], [390, 150], [0, 150]];
  const versLocal = homographie(coins, local);
  const echelle = 390 / Math.hypot(coins[1][0] - coins[0][0], coins[1][1] - coins[0][1]);   // px de pastille par px d'image
  const m = Math.max(12, 5.5 * echelle), r = 50 + m;
  const zone = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const [lx, ly] = projeter(versLocal, x + i, y + j);
    if (boite) { if (lx >= boite[0] && lx <= boite[2] && ly >= boite[1] && ly <= boite[3]) zone[j * w + i] = 1; continue; }
    if (lx < Math.max(-m, depuis) || lx > 390 + m || ly < -m || ly > 150 + m) continue;
    const cx = Math.max(-m + r, Math.min(390 + m - r, lx)), cy = Math.max(-m + r, Math.min(150 + m - r, ly));
    if (Math.hypot(lx - cx, ly - cy) <= r) zone[j * w + i] = 1;
  }
  // Le grain du papier, en deux parts. Le grain fin vient de la bande de papier sous la pastille, répétée
  // en miroir. Les marbrures (plus larges que la bande : la répéter ferait des rayures) sont tirées au
  // hasard, à la force mesurée sur cette même bande.
  const bh = Math.max(4, Math.min(papier.h, img.height - papier.y)), bande = Buffer.alloc(w * bh);
  for (let j = 0; j < bh; j++) for (let i = 0; i < w; i++) bande[j * w + i] = Math.round(lum(img, ((papier.y + j) * W + x + i) * 3));
  const brut = { raw: { width: w, height: bh, channels: 1 } };
  // (sharp rend trois canaux même pour une image à un canal : on n'en garde qu'un)
  const fin = await sharp(bande, brut).blur(2.5).extractChannel(0).raw().toBuffer(), large = await sharp(bande, brut).blur(9).extractChannel(0).raw().toBuffer();
  let s2 = 0;
  for (let k = 0; k < fin.length; k++) s2 += (fin[k] - large[k]) ** 2;
  const force = Math.sqrt(s2 / fin.length);
  let graine = 20241114;
  const alea = () => { graine = (graine * 1664525 + 1013904223) >>> 0; return graine / 4294967296; };
  const blanc = Buffer.alloc(w * h);
  for (let k = 0; k < blanc.length; k++) blanc[k] = Math.round(128 + (alea() + alea() + alea() + alea() - 2) * 110);
  const nuage = await sharp(blanc, { raw: { width: w, height: h, channels: 1 } }).blur(5).extractChannel(0).raw().toBuffer();
  let moy = 0, var2 = 0;
  for (let k = 0; k < nuage.length; k++) moy += nuage[k];
  moy /= nuage.length;
  for (let k = 0; k < nuage.length; k++) var2 += (nuage[k] - moy) ** 2;
  const gain = force / Math.sqrt(var2 / nuage.length);
  comblerPapier(img, rect, zone, (i, j) => {
    const k = j % (2 * bh), bj = k < bh ? k : 2 * bh - 1 - k;
    return bande[bj * w + i] - fin[bj * w + i] + (nuage[j * w + i] - moy) * gain;
  });
  if (!svg) return;
  const html = `<!doctype html><meta charset="utf-8"><style>${JBM}html,body{margin:0;background:#fff}
#c{position:relative;width:${w}px;height:${h}px;overflow:hidden}
#t{position:absolute;left:0;top:0;width:390px;height:150px;transform-origin:0 0;transform:${matrix3d(390, 150, coins.map(([cx, cy]) => [cx - x, cy - y]))}}
svg{position:absolute;left:0;top:0;overflow:visible}
</style><div id="c"><div id="t"><svg width="390" height="150" viewBox="0 0 390 150">${svg}</svg></div></div>`;
  const png = join(dir, "pastille.png");
  shoot(html, Math.max(w, 500), Math.max(h, 400), png, dir);
  await encrer(img, rect, png, encreMin);
}

/**
 * Remplace une ligne de texte posée sur une courbe (la phrase du bord du
 * couvercle, vue de face : elle suit l'arrondi du pot). `points` : trois points
 * de sa ligne de base — début, milieu, fin ; `cap` : la hauteur de ses
 * capitales, en pixels. L'encre trouvée le long de la courbe est effacée, puis
 * `texte` est composé sur la même courbe, serré pour tenir d'un bout à l'autre.
 */
export async function remplacerLigneCourbe(img, { points, cap }, texte, dir, { graisse = 600, encreMin = 0.22, seuil = 0.72 } = {}) {
  const [p0, p1, p2] = points;
  const c = [2 * p1[0] - (p0[0] + p2[0]) / 2, 2 * p1[1] - (p0[1] + p2[1]) / 2];   // le point de contrôle : la courbe passe par p1 à mi-chemin
  const B = (t) => [(1 - t) ** 2 * p0[0] + 2 * t * (1 - t) * c[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * t * (1 - t) * c[1] + t * t * p2[1]];
  const N = 400, pts = Array.from({ length: N + 1 }, (_, k) => B(k / N));
  let longueur = 0;
  for (let k = 1; k <= N; k++) longueur += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
  const marge = cap + 14, xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const x = Math.max(0, Math.floor(Math.min(...xs) - marge)), y = Math.max(0, Math.floor(Math.min(...ys) - marge));
  const w = Math.min(img.width - x, Math.ceil(Math.max(...xs) + marge) - x), h = Math.min(img.height - y, Math.ceil(Math.max(...ys) + marge) - y);
  const rect = { x, y, w, h };
  const encre = masqueEncre(img, rect, { seuil });
  // Ne garder que l'encre de la bande : de 4 px sous la ligne de base à 5 px au-dessus des capitales.
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!encre[j * w + i]) continue;
    let best = Infinity, bk = 0;
    for (let k = 0; k <= N; k += 2) { const d = (pts[k][0] - x - i) ** 2 + (pts[k][1] - y - j) ** 2; if (d < best) { best = d; bk = k; } }
    const a = pts[Math.max(0, bk - 1)], b = pts[Math.min(N, bk + 1)], tl = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = ((x + i - pts[bk][0]) * -(b[1] - a[1]) + (y + j - pts[bk][1]) * (b[0] - a[0])) / tl;   // > 0 : sous la ligne de base
    if (d > 6 || d < -(cap + 12) || ((bk === 0 || bk >= N - 1) && Math.sqrt(best) > cap)) encre[j * w + i] = 0;
  }
  effacer(img, rect, dilater(encre, w, h, 2));
  // Le texte sur la courbe. Les lettres sont plus étroites que la police : on compose dans un repère étiré, puis on resserre.
  const fs = cap / 0.73, naturel = texte.length * 0.6 * fs, k = longueur / naturel;
  const L = (q) => `${(q[0] - x) / k} ${q[1] - y}`;
  const html = `<!doctype html><meta charset="utf-8"><style>${JBM}html,body{margin:0;background:#fff}
svg{position:absolute;left:0;top:0;overflow:visible}
text{font-family:JBM;font-weight:${graisse};font-size:${fs}px;fill:#000}
</style><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g transform="scale(${k},1)"><path id="p" d="M ${L(p0)} Q ${L(c)} ${L(p2)}" fill="none"/><text><textPath href="#p">${texte}</textPath></text></g></svg>`;
  const png = join(dir, "courbe.png");
  shoot(html, Math.max(w, 500), Math.max(h, 400), png, dir);
  await encrer(img, rect, png, encreMin);
}

export async function ecrire(img, path, options = {}) {
  const s = sharp(img.data, { raw: { width: img.width, height: img.height, channels: 3 } });
  if (path.endsWith(".webp")) await s.webp({ quality: 90, ...options }).toFile(path);
  else if (path.endsWith(".png")) await s.png().toFile(path);
  else await s.jpeg({ quality: 94, ...options }).toFile(path);
}
