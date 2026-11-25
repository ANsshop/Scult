/**
 * Deux vues de la boîte de pochons que le modèle 3D ne sait pas montrer — la
 * boîte ouverte, pleine de pochons, et la boîte avec un pochon posé devant —
 * découpées dans la feuille de référence du produit
 * (docs/refonte-bouffon/sources/planche-pochons.jpg) et détourées.
 *
 *   node scripts/pochons-planche.mjs        → public/pochons/boite-{ouverte,pochon}-{600,1100}.webp
 *
 * Le détourage : le fond de la feuille est un gris uni, plus sombre que le
 * blanc de la boîte même dans l'ombre. On part des bords de la case et on
 * retire tout ce qui est gris et pas plus clair que SEUIL, de proche en
 * proche : le fond et l'ombre portée partent, la boîte reste. Les quatre
 * autres vues de la galerie sont des rendus du modèle (scripts/3d/rendus-pochons.sh).
 *
 * ⚠ Ce sont des images générées, pas des photos du produit : à remplacer par
 * de vraies photos quand la boîte existera (ASSUMPTIONS.md).
 */
import sharp from "sharp";

const SOURCE = "docs/refonte-bouffon/sources/planche-pochons.jpg";
/** Les cases de la feuille : [gauche, haut, largeur, hauteur]. */
const VUES = { ouverte: [794, 764, 999, 750], pochon: [1796, 764, 886, 750] };
const SEUIL = 172;       // luminance au-dessus de laquelle un gris est du blanc dans l'ombre, pas du fond
const GRIS = 14;         // écart maximal entre rouge, vert et bleu pour parler de gris
const LARGEURS = [600, 1100];

/** Un masque (0 ou 255 par pixel) passé par sharp : flou puis seuil — de quoi grossir ou rogner les formes. */
const forme = (masque, W, H, flou, seuil) =>
  sharp(masque, { raw: { width: W, height: H, channels: 1 } }).blur(flou).threshold(seuil).extractChannel(0).raw().toBuffer();

for (const [nom, [left, top, width, height]] of Object.entries(VUES)) {
  const { data, info } = await sharp(SOURCE).extract({ left, top, width, height }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;

  // 1. Le fond : remplissage depuis les bords, à travers les gris pas trop clairs
  const fond = new Uint8Array(N), pile = [];
  const gris = (i) => {
    const r = data[3 * i], g = data[3 * i + 1], b = data[3 * i + 2];
    return Math.max(r, g, b) - Math.min(r, g, b) <= GRIS && (r + g + b) / 3 <= SEUIL;
  };
  const voir = (i) => { if (!fond[i] && gris(i)) { fond[i] = 1; pile.push(i); } };
  for (let x = 0; x < W; x++) { voir(x); voir((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { voir(y * W); voir(y * W + W - 1); }
  while (pile.length) {
    const i = pile.pop(), x = i % W;
    if (x > 0) voir(i - 1);
    if (x < W - 1) voir(i + 1);
    if (i >= W) voir(i - W);
    if (i < N - W) voir(i + W);
  }
  let masque = Buffer.alloc(N);
  for (let i = 0; i < N; i++) masque[i] = fond[i] ? 0 : 255;

  // 2. On rebouche les encoches (le dessous du couvercle, dans l'ombre, est aussi gris que le fond) : grossir, puis rogner d'autant
  masque = await forme(await forme(masque, W, H, 3, 40), W, H, 3, 215);

  // 3. On ne garde que les grandes formes : la boîte, le couvercle, le pochon ; les miettes de fond partent
  const vu = new Int32Array(N);
  let etiquette = 0;
  for (let depart = 0; depart < N; depart++) {
    if (!masque[depart] || vu[depart]) continue;
    etiquette++;
    const membres = [depart];
    vu[depart] = etiquette;
    for (let k = 0; k < membres.length; k++) {
      const i = membres[k], x = i % W;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
        if (j >= 0 && j < N && masque[j] && !vu[j]) { vu[j] = etiquette; membres.push(j); }
      }
    }
    if (membres.length < N * 0.004) for (const i of membres) masque[i] = 0;
  }

  // 4. On rogne un pixel (le liseré gris du bord) et on adoucit
  const alpha = await sharp(masque, { raw: { width: W, height: H, channels: 1 } }).blur(1.6).threshold(200).blur(0.8).extractChannel(0).raw().toBuffer();
  const rgba = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    rgba[4 * i] = data[3 * i]; rgba[4 * i + 1] = data[3 * i + 1]; rgba[4 * i + 2] = data[3 * i + 2]; rgba[4 * i + 3] = alpha[i];
  }
  const net = await sharp(await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer()).trim({ threshold: 2 }).png().toBuffer({ resolveWithObject: true });
  for (const w of LARGEURS) {
    await sharp(net.data).resize({ width: Math.min(w, net.info.width) }).webp({ quality: 88, alphaQuality: 92 }).toFile(`public/pochons/boite-${nom}-${w}.webp`);
  }
  console.log(`  boite-${nom}`, `${net.info.width} × ${net.info.height}`);
}
