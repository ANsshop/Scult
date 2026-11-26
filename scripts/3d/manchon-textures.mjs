#!/usr/bin/env node
// Le manchon plastique scellé du pot (idée d'emballage, 2026-11-26) : un film
// rétractable imprimé comme le faux site rose de l'intro, qui cache le vrai pot.
// On le déchire, et la blague tombe : dessous, le bouffon.
//
//   node scripts/3d/manchon-textures.mjs [dossier de sortie]
//
// Écrit quatre films déroulés (PNG avec transparence), que
// scripts/3d/render_manchon.py pose sur le pot :
//   manchon-rose.png     le film entier, opaque
//   manchon-dechire.png  le même, déchiré par le milieu (le trou est transparent)
//   manchon-coeur.png    opaque, avec une fenêtre en cœur sur le masque du bouffon
//   manchon-givre.png    film rose translucide : seules les impressions blanches sont opaques
//   manchon-fente.png    pour l'animation : la ligne de déchirure (blanc = le film se fend)
//
// Le dessin est en millimètres. Largeur = le tour du pot (271,4 mm ; le centre
// de la face est au milieu, la soudure au dos). Hauteur = le film de bas en
// haut, 151,5 mm : dessus du couvercle (7) · bord (5,5) · flanc du couvercle
// (17,5) · gorge (2,8) · corps (112,4) · arrondi du fond (6,3). Ces mesures
// sont celles de render_manchon.py : les changer aux deux endroits.
//
// Textes : ceux du faux site (INTRO, src/lib/content/site.ts). Aucun poids,
// aucun dosage : le film n'affirme rien. Les mentions obligatoires, que le
// film recouvre, ont leur emplacement au dos (à reprendre de l'étiquette).
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const OUT = resolve(process.argv[2] ?? "docs/3d/manchon/textures");
mkdirSync(OUT, { recursive: true });

const W = 271.43;
const H = 151.5;
const PX = 4096;
const CX = W / 2;           // le centre de la face
const Y_BODY = 32.8;        // haut du corps
const Y_BASE = 145.2;       // début de l'arrondi du fond
const Y_MASK = 74.6;        // le masque du bouffon, sur l'étiquette dessous

const ROSE = "#ff8cc3";
const ROSE_VIF = "#ff5fa8";
const PRUNE = "#b0246a";

const font = (file) => readFileSync(resolve("public/fonts", file)).toString("base64");

// Un tirage au sort reproductible : les mêmes cœurs et étoiles à chaque passage.
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

const HEART = "M0 6 C-10 -1 -6 -9 0 -4 C6 -9 10 -1 0 6Z";
const STAR = "M0 -5 Q0.6 -0.6 5 0 Q0.6 0.6 0 5 Q-0.6 0.6 -5 0 Q-0.6 -0.6 0 -5Z";

/** Cœurs et étoiles blancs semés sur tout le tour, hors de la zone centrale `keep` (± mm autour de la face). */
function confetti(keep) {
  const out = [];
  for (let i = 0; i < 74; i++) {
    const x = rnd() * W;
    const y = Y_BODY + 6 + rnd() * (Y_BASE - Y_BODY - 20);
    const s = 0.22 + rnd() * 0.42;
    const star = rnd() > 0.5;
    const o = (0.35 + rnd() * 0.5).toFixed(2);
    const r = Math.round(rnd() * 40 - 20);
    if (Math.abs(x - CX) < keep) continue;
    out.push(`<path d="${star ? STAR : HEART}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r}) scale(${s.toFixed(2)})" fill="#fff" opacity="${o}"/>`);
  }
  return out.join("");
}

/** Le couvercle : rose plus vif, une frise de petits cœurs. */
function lid(film) {
  const hearts = [];
  for (let i = 0; i < 24; i++) hearts.push(`<path d="${HEART}" transform="translate(${(i * W / 24 + 5).toFixed(1)} ${i % 2 ? 17 : 24}) scale(0.34)" fill="#fff" opacity="0.9"/>`);
  return `${film ? "" : `<rect width="${W}" height="${Y_BODY - 1.4}" fill="${ROSE_VIF}"/>`}${hearts.join("")}`;
}

/** Le bas : un feston blanc et la devise du faux site, tout autour. */
function foot() {
  const scallops = [];
  for (let x = 0; x < W; x += 4.6) scallops.push(`<circle cx="${x.toFixed(1)}" cy="136.4" r="2.3" fill="#fff"/>`);
  const line = Array.from({ length: 5 }, () => "100 % douceur · 0 % prise de tête · ").join("");
  return `${scallops.join("")}<rect y="136.4" width="${W}" height="${H - 136.4}" fill="#fff"/>
    <text x="0" y="142.6" font-family="Quicksand" font-weight="700" font-size="3.4" fill="${PRUNE}" textLength="${W}" lengthAdjust="spacing">${line}</text>`;
}

/** La bande d'ouverture : deux lignes de prédécoupe et sa languette, sur le côté droit de la face. */
function tearStrip() {
  const x = CX + 49;
  return `<g stroke="#fff" stroke-width="0.4" stroke-dasharray="1.3 1.1" opacity="0.95"><path d="M${x} 0V${H}"/><path d="M${x + 6.4} 0V${H}"/></g>
    <text transform="translate(${x + 4.3} 104) rotate(-90)" font-family="Pacifico" font-size="3.6" fill="#fff">tire ici ♡ tire ici ♡ tire ici ♡</text>`;
}

/** Le dos : le titre du faux site d'un côté de la soudure, l'emplacement des mentions de l'autre. */
function back() {
  return `<g font-family="Pacifico" fill="#fff" text-anchor="middle"><text x="36" y="72" font-size="9.5">Ton pré-workout</text><text x="36" y="86" font-size="12">tout doux</text></g>
    <text x="36" y="97" text-anchor="middle" font-family="Quicksand" font-weight="700" font-size="3" fill="${PRUNE}">Le pré-workout tout mignon</text>
    <rect x="207" y="46" width="54" height="80" rx="3" fill="#fff" opacity="0.94"/>
    <g font-family="Quicksand" fill="${PRUNE}"><text x="211" y="54" font-weight="700" font-size="3.2">MENTIONS OBLIGATOIRES</text>
    <text font-size="2.5" font-weight="600"><tspan x="211" y="60">À reprendre de l'étiquette du pot :</tspan><tspan x="211" y="64">dénomination, ingrédients,</tspan><tspan x="211" y="68">composition par dose, précautions,</tspan><tspan x="211" y="72">mention caféine, poids net,</tspan><tspan x="211" y="76">lot et date, responsable.</tspan></text></g>`;
}

/** La face du faux pot rose : le cœur, SCULT en lettres rondes, PRE-WORKOUT, la pastille, « tout doux ». */
function faceRose() {
  const scult = (dy, fill, o) => `<text x="${CX}" y="${82 + dy}" text-anchor="middle" font-family="Quicksand" font-weight="700" font-size="25" textLength="60" lengthAdjust="spacingAndGlyphs" fill="${fill}" stroke="${fill}" stroke-width="4.6" stroke-linejoin="round" opacity="${o}">SCULT</text>`;
  return `<path d="${HEART}" transform="translate(${CX} 50.5) scale(0.62)" fill="#fff"/>
    ${scult(1.3, "#e8479a", 0.55)}${scult(0, "#fff", 1)}
    <text x="${CX}" y="94.5" text-anchor="middle" font-family="Quicksand" font-weight="700" font-size="4.6" letter-spacing="1.7" fill="#fff">PRE-WORKOUT</text>
    <rect x="${CX - 27}" y="100" width="54" height="7.4" rx="3.7" fill="#fff" opacity="0.94"/>
    <text x="${CX}" y="105.1" text-anchor="middle" font-family="Quicksand" font-weight="700" font-size="3.1" fill="${PRUNE}">Nouveau · saveur fraise bonbon</text>
    <text x="${CX}" y="126" text-anchor="middle" font-family="Pacifico" font-size="13" fill="#fff">tout doux</text>`;
}

/** La face « fenêtre » : le nom en lettres liées, la fenêtre en cœur cousue de blanc, le reste dessous. */
function faceCoeur() {
  return `<text x="${CX}" y="52.5" text-anchor="middle" font-family="Pacifico" font-size="16" fill="#fff">Scult</text>
    <path d="${HEART}" transform="translate(${CX} ${Y_MASK + 2}) scale(2.72)" fill="none" stroke="#fff" stroke-width="0.2" stroke-dasharray="0.55 0.45"/>
    <text x="${CX}" y="106" text-anchor="middle" font-family="Quicksand" font-weight="700" font-size="4.6" letter-spacing="1.7" fill="#fff">PRE-WORKOUT</text>
    <text x="${CX}" y="123" text-anchor="middle" font-family="Pacifico" font-size="12" fill="#fff">tout doux</text>`;
}

/** La face du film givré : rien au centre (le bouffon se voit à travers), un cadre de cœurs et les mots en bas. */
function faceGivre() {
  const ring = [];
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    ring.push(`<path d="${HEART}" transform="translate(${(CX + Math.cos(a) * 41).toFixed(1)} ${(80 + Math.sin(a) * 38).toFixed(1)}) rotate(${Math.round(Math.cos(a) * 18)}) scale(${i % 2 ? 0.3 : 0.42})" fill="#fff"/>`);
  }
  return `${ring.join("")}<text x="${CX}" y="131" text-anchor="middle" font-family="Pacifico" font-size="11" fill="#fff">tout doux</text>`;
}

/** Le trou de la déchirure : une bande en dents de scie, étroite sur le couvercle, large au milieu du corps. */
function tear() {
  const left = [], right = [];
  for (let y = -2; y <= H + 2; y += 3.1) {
    const t = Math.min(1, Math.max(0, y / H));
    const half = 4 + 19 * Math.sin(Math.PI * Math.min(1, t * 1.12)) ** 0.8;   // demi-largeur : le S et le T de « SCULT » restent de part et d'autre
    const lean = (t - 0.5) * 10;                                               // la déchirure part en biais
    left.push([CX - 3 + lean - half + (rnd() - 0.5) * 5.5, y]);
    right.push([CX - 3 + lean + half + (rnd() - 0.5) * 5.5, y]);
  }
  const pts = [...left, ...right.reverse()];
  const d = "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z";
  return { hole: `<path d="${d}" fill="#000"/>`, edge: `<path d="${d}" fill="none" stroke="#fff" stroke-width="0.9" stroke-linejoin="round" opacity="0.85"/>` };
}

function sheet(kind) {
  seed = 7;
  const film = kind === "givre";
  const rip = kind === "dechire" ? tear() : null;
  const hole = kind === "coeur" ? `<path d="${HEART}" transform="translate(${CX} ${Y_MASK + 2}) scale(2.45)" fill="#000"/>` : rip?.hole ?? "";
  const face = kind === "coeur" ? faceCoeur() : film ? faceGivre() : faceRose();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${PX}" height="${Math.round(PX * H / W)}">
    <defs>
      <linearGradient id="fond" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7fbc"/><stop offset="1" stop-color="#ffa6d2"/></linearGradient>
      <mask id="trou"><rect width="${W}" height="${H}" fill="#fff"/>${hole}</mask>
    </defs>
    <g mask="url(#trou)">
      ${film ? "" : `<rect width="${W}" height="${H}" fill="url(#fond)"/>`}
      ${lid(film)}
      ${confetti(film ? 46 : 40)}
      ${face}
      ${film ? "" : back()}
      ${tearStrip()}
      ${foot()}
    </g>
    ${rip?.edge ?? ""}
  </svg>`;
}

const html = (svg) => `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: Pacifico; src: url(data:font/woff2;base64,${font("pacifico-latin-400-normal.woff2")}) format("woff2"); }
@font-face { font-family: Quicksand; font-weight: 300 700; src: url(data:font/woff2;base64,${font("quicksand-latin-wght-normal.woff2")}) format("woff2"); }
html, body { margin: 0; background: transparent; } svg { display: block; }
</style>${svg}`;

/**
 * La fente du film d'animation (render_manchon.py, `-- film`) : blanc là où le film se fend quand la déchirure
 * passe — une ligne en dents de scie sur le devant, de haut en bas. Noir ailleurs.
 */
function slit() {
  seed = 11;
  const left = [], right = [];
  for (let y = -2; y <= H + 2; y += 2.3) {
    const c = CX + (rnd() - 0.5) * 3.2;
    const w = 0.5 + rnd() * 2.6;
    left.push([c - w, y]);
    right.push([c + w, y]);
  }
  const pts = [...left, ...right.reverse()];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${PX}" height="${Math.round(PX * H / W)}">
    <rect width="${W}" height="${H}" fill="#000"/><path d="M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z" fill="#fff"/></svg>`;
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: PX, height: Math.round(PX * H / W) } });
for (const kind of ["rose", "dechire", "coeur", "givre"]) {
  await page.setContent(html(sheet(kind)));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(OUT, `manchon-${kind}.png`), omitBackground: true });
  console.log("écrit", `manchon-${kind}.png`);
}
await page.setContent(html(slit()));
await page.screenshot({ path: resolve(OUT, "manchon-fente.png") });
console.log("écrit", "manchon-fente.png");
await browser.close();
