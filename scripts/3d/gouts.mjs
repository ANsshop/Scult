/**
 * Décline l'étiquette du pot CRI par goût.
 *
 * Même pot, même maquette, même dos : seules changent la pastille de goût en
 * face avant et, au dos, la ligne « Saveur … » et la liste d'ingrédients.
 * Pour chaque goût, écrit dans docs/3d/textures/ :
 *   wrap-<slug>.jpg  l'étiquette complète à enrouler sur le modèle 3D (4096 × 1652)
 *   dos-<slug>.jpg   le dos à plat (1500 × 2102)
 *
 *   node scripts/3d/gouts.mjs            # tous les goûts
 *   node scripts/3d/gouts.mjs ice-tea-peche
 *
 * Sources (docs/3d/sources/) : face.jpg (la face avant, fruits rouges),
 * dos.jpg (le dos d'origine), papier.jpg (le grain du papier),
 * gouts/<slug>.jpg (la photo de la pastille), Cousine-Regular.ttf (la police
 * du dos). Le rendu passe par Chrome sans interface.
 *
 * ⚠ Les listes d'ingrédients sont des estimations : seuls l'arôme et le
 * colorant changent par rapport à la liste d'origine, elle-même estimée
 * (ASSUMPTIONS.md). Elles se remplacent par celles du façonnier.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SRC = resolve("docs/3d/sources");
const OUT = resolve("docs/3d/textures");
const FONTS = resolve("src/fonts");

const BASE =
  "L-citrulline, bêta-alanine, créatine monohydrate, L-tyrosine, taurine, citrate de sodium, acidifiant : acide citrique, {AROME}, citrate de potassium, L-théanine, édulcorant : glycosides de stéviol, caféine anhydre, anti-agglomérant : dioxyde de silicium, colorant : {COLORANT}, D-pantothénate de calcium, chlorhydrate de pyridoxine.";

/** `photo` : cadrage de la photo dans la pastille (object-position). */
export const GOUTS = [
  {
    slug: "cassis-framboise",
    nom: ["Cassis", "Framboise"],
    saveur: "Saveur cassis framboise",
    photo: "22% 55%",
    ingredients: BASE.replace("{AROME}", "arômes naturels de cassis et de framboise").replace("{COLORANT}", "rouge de betterave"),
  },
  {
    slug: "ice-tea-peche",
    nom: ["Ice tea", "Pêche"],
    saveur: "Saveur ice tea pêche",
    photo: "30% 50%",
    ingredients: BASE.replace("{AROME}", "arômes naturels de thé et de pêche").replace("{COLORANT}", "caramel ordinaire"),
  },
];

const file = (p) => `file://${p}`;

function shoot(html, width, height, out, dir) {
  const page = join(dir, "page.html");
  writeFileSync(page, html);
  execFileSync(CHROME, [
    "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1", "--allow-file-access-from-files",
    `--user-data-dir=${join(dir, "profil")}`, "--virtual-time-budget=4000",
    `--window-size=${width},${height}`, `--screenshot=${out}`, file(page),
  ], { stdio: "ignore" });
}

const fonts = `
@font-face{font-family:JBM;src:url('${file(join(FONTS, "jetbrains-mono-latin-wght-normal.woff2"))}');font-weight:100 800}
@font-face{font-family:Cousine;src:url('${file(join(SRC, "Cousine-Regular.ttf"))}')}
html,body{margin:0;background:#000}`;

/** Le dos : la ligne « Saveur … » et le paragraphe d'ingrédients sont recomposés, le reste est d'origine. */
function dosHtml(g, fond) {
  return `<!doctype html><meta charset="utf-8"><style>${fonts}
#c{position:relative;width:1500px;height:2102px;overflow:hidden;background:url('${file(join(SRC, "dos.jpg"))}') 0 0/1500px 2102px}
.cache{position:absolute;background:${fond}}
.saveur{position:absolute;right:71px;top:105px;height:32px;font:21.4px/32px Cousine,monospace;letter-spacing:2.3px;margin-right:-2.3px;text-transform:uppercase;color:#141416;white-space:nowrap}
.ingr{position:absolute;left:70px;top:968px;width:1345px;font:23px/31.5px Cousine,monospace;color:#141416}
</style><div id="c">
<div class="cache" style="left:1080px;top:104px;width:360px;height:34px"></div>
<div class="saveur">${g.saveur}</div>
<div class="cache" style="left:60px;top:964px;width:1390px;height:132px"></div>
<div class="ingr">${g.ingredients}</div>
</div>`;
}

/** La face : l'ancienne pastille est recouverte de papier, la nouvelle est posée au même endroit (390 × 150). */
function faceHtml(g) {
  return `<!doctype html><meta charset="utf-8"><style>${fonts}
#c{position:relative;width:3840px;height:1648px;overflow:hidden;background:url('${file(join(SRC, "face.jpg"))}') 0 0/3840px 1648px}
.papier{position:absolute;left:2052px;top:1404px;width:430px;height:186px;background:url('${file(join(SRC, "papier.jpg"))}') -300px -260px;
  -webkit-mask-image:linear-gradient(to right,transparent 0,#000 12px,#000 calc(100% - 12px),transparent 100%),linear-gradient(to bottom,transparent 0,#000 12px,#000 calc(100% - 12px),transparent 100%);
  -webkit-mask-composite:source-in;mask-composite:intersect}
.pastille{position:absolute;left:2072px;top:1422px;width:390px;height:150px;box-sizing:border-box;border:3.5px solid #131315;border-radius:75px;overflow:hidden}
.pastille img{position:absolute;left:0;top:0;width:52%;height:100%;object-fit:cover;object-position:${g.photo};
  -webkit-mask-image:linear-gradient(to right,#000 70%,transparent 100%);mask-image:linear-gradient(to right,#000 70%,transparent 100%)}
.nom{position:absolute;left:49%;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;
  font:700 40px/1.16 JBM,monospace;text-transform:uppercase;color:#131315;white-space:nowrap;transform:scaleX(0.72);transform-origin:left center;opacity:.94;filter:blur(0.25px)}
</style><div id="c"><div class="papier"></div>
<div class="pastille"><img src="${file(join(SRC, "gouts", `${g.slug}.jpg`))}"><div class="nom"><span>${g.nom[0]}</span><span>${g.nom[1]}</span></div></div>
</div>`;
}

/** L'étiquette complète : la face au centre, le dos sur la couture arrière, la phrase du couvercle tout autour. */
function wrapHtml(face, dos) {
  const phrase = Array.from({ length: 5 }, () => "<i>·</i><span>RIEN NE SE SCULPTE EN SILENCE.</span>").join("") + "<i>·</i>";
  return `<!doctype html><meta charset="utf-8"><style>${fonts}
#c{position:relative;width:4096px;height:1652px;overflow:hidden;background:url('${file(join(SRC, "papier.jpg"))}') 0 0/1396px 1396px}
#front{position:absolute;left:372px;top:107px;width:3351px;height:1438px;
  -webkit-mask-image:linear-gradient(to right,transparent 0,#000 110px,#000 calc(100% - 110px),transparent 100%),linear-gradient(to bottom,transparent 0,#000 14px,#000 calc(100% - 40px),transparent 100%);
  -webkit-mask-composite:source-in;mask-composite:intersect}
.dos{position:absolute;top:452px;height:1050px;width:749px;mix-blend-mode:multiply;filter:brightness(1.1) contrast(1.18)}
.lid{position:absolute;top:128px;width:2605px;height:38px;display:flex;justify-content:space-between;align-items:center;
  font:500 26px/1 JBM,monospace;color:#17181b;white-space:nowrap;transform:scaleY(1.27);transform-origin:center;opacity:.93}
</style><div id="c">
<img id="front" src="${file(face)}">
<img class="dos" src="${file(dos)}" style="left:-374.5px"><img class="dos" src="${file(dos)}" style="left:3721.5px">
<div class="lid" style="left:2800px">${phrase}</div><div class="lid" style="left:-1296px">${phrase}</div>
</div>`;
}

const only = process.argv[2];
mkdirSync(OUT, { recursive: true });
// La couleur du fond du dos, relevée dans une zone vide
const { data } = await sharp(join(SRC, "dos.jpg")).extract({ left: 1440, top: 40, width: 20, height: 20 }).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
const fond = `rgb(${data[0]},${data[1]},${data[2]})`;

for (const g of GOUTS.filter((x) => !only || x.slug === only)) {
  const dir = mkdtempSync(join(tmpdir(), "gout-"));
  try {
    const dosPng = join(dir, "dos.png");
    shoot(dosHtml(g, fond), 1500, 2102, dosPng, dir);
    const dos = join(OUT, `dos-${g.slug}.jpg`);
    await sharp(dosPng).extract({ left: 0, top: 0, width: 1500, height: 2102 }).jpeg({ quality: 90 }).toFile(dos);

    const facePng = join(dir, "face.png");
    shoot(faceHtml(g), 3840, 1648, facePng, dir);
    const face = join(dir, "face.jpg");
    await sharp(facePng).extract({ left: 0, top: 0, width: 3840, height: 1648 }).jpeg({ quality: 94 }).toFile(face);

    const wrapPng = join(dir, "wrap.png");
    shoot(wrapHtml(face, dos), 4096, 1652, wrapPng, dir);
    await sharp(wrapPng).extract({ left: 0, top: 0, width: 4096, height: 1652 }).jpeg({ quality: 90 }).toFile(join(OUT, `wrap-${g.slug}.jpg`));
    // Contrôle : la pastille et le dos, à la loupe
    await sharp(face).extract({ left: 2040, top: 1380, width: 760, height: 230 }).resize({ width: 1140 }).jpeg({ quality: 90 }).toFile(join(OUT, `controle-pastille-${g.slug}.jpg`));
    console.log("✓", g.slug);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
