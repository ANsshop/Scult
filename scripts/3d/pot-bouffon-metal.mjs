/**
 * Cartes « métal » du pot 3D : où l'étiquette est en rose métallisé (le nom
 * SCULT, le cœur, les traits, le bandeau, le sourire du couvercle), le pot
 * réfléchit la lumière comme du chrome ; ailleurs il reste mat. Les zones sont
 * repérées à leur couleur dans les textures du modèle (docs/3d/bouffon/textures/),
 * donc au pixel près sur la même mise en page.
 *
 *   node scripts/3d/pot-bouffon-metal.mjs
 *
 * Écrit public/models/pot-scult-metal-etiquette.jpg et -dessus.jpg, au format
 * glTF (vert = rugosité, bleu = métal). La visionneuse les pose sur le modèle
 * au chargement (src/components/site/Pot3D.tsx) : le fichier .glb ne change pas.
 */
import sharp from "sharp";

const SRC = "docs/3d/bouffon/textures";
const OUT = "public/models";
/** Rugosité du rose métallisé (bas = miroir) et du reste du pot (haut = mat). */
const ROUGH_METAL = 0.24;
const ROUGH_MAT = 0.8;

async function metalMap(input, output, width) {
  const { data, info } = await sharp(`${SRC}/${input}`).resize({ width }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0, o = 0; i < data.length; i += info.channels, o += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // Rose : beaucoup de rouge, peu de vert, du bleu entre les deux. 0 = mat, 1 = métal, avec une transition douce.
    const pink = Math.max(0, Math.min(1, (r - g - 45) / 50)) * Math.max(0, Math.min(1, (b - g + 10) / 30)) * Math.max(0, Math.min(1, (r - 70) / 50));
    out[o] = 255;                                                             // rouge : occlusion, inutilisée
    out[o + 1] = Math.round(255 * (ROUGH_MAT + (ROUGH_METAL - ROUGH_MAT) * pink)); // vert : rugosité
    out[o + 2] = Math.round(255 * pink);                                      // bleu : métal
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }).blur(0.6).jpeg({ quality: 86, chromaSubsampling: "4:4:4" }).toFile(`${OUT}/${output}`);
  console.log(`✓ ${OUT}/${output} (${info.width} × ${info.height})`);
}

await metalMap("wrap.jpg", "pot-scult-metal-etiquette.jpg", 2048);
await metalMap("lid-top.jpg", "pot-scult-metal-dessus.jpg", 512);
