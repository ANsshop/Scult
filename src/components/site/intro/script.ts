import { INTRO } from "@/lib/content/site";
import { imageUrl } from "@/lib/content/images";

/**
 * L'intro rose → glitch → dark, en deux petits scripts inline, sans React :
 * elle ne doit dépendre ni du téléchargement ni de l'hydratation du site.
 *
 *  1. INTRO_HEAD_SCRIPT, dans le <head> de toutes les pages : décide, avant le
 *     premier affichage, si l'intro joue, et pose `data-intro="play"` ou
 *     `"skip"` sur <html>. Le CSS (intro.css) affiche la couche rose selon cet
 *     attribut : ni flash de rose pour qui revient, ni flash de dark pour qui
 *     arrive. Sans JavaScript, l'attribut n'existe pas et la couche reste masquée.
 *  2. introBodyScript(), sur l'accueil, juste après la coquille `#intro-rose` :
 *     y écrit le faux site rose, attend 1200 ms (ou le premier geste), joue le
 *     glitch pendant 700 ms, vide la coquille et enregistre la clé.
 *
 * Le texte rose n'existe donc dans le HTML que dans une chaîne de script : il
 * n'est ni lu par un lecteur d'écran, ni présent pour qui a déjà vu la blague.
 *
 * États de <html data-intro> : play → glitch → done (ou play → fade → done en
 * mouvement réduit) ; skip si l'intro ne joue pas.
 */

/** La clé qui retient que le visiteur a vu l'intro. */
export const INTRO_KEY = "scult_intro_vue";

/** Les deux temps du déroulé, en millisecondes. */
const ROSE_MS = 1200;
const GLITCH_MS = 700;

const ROSE_MOBILE = imageUrl("hero-rose-mobile", 780, "avif");
const ROSE_DESKTOP = imageUrl("hero-rose-desktop", 1920, "avif");
const FONTS = ["/fonts/pacifico-latin-400-normal.woff2", "/fonts/quicksand-latin-wght-normal.woff2"];

/**
 * Joue-t-on l'intro ? Seulement sur l'accueil, à l'arrivée sur le site :
 *  - `?intro=1` la force (et sort le paramètre de l'adresse, pour qu'un
 *    rechargement ne la rejoue pas) ; `?intro=0` la désactive ;
 *  - sinon : jamais vue (clé absente), pas en provenance d'une autre page du
 *    site, pas un robot d'indexation. Si le stockage est illisible, on ne
 *    joue pas : mieux vaut pas de blague qu'une blague à chaque visite.
 * Quand elle joue, les deux polices roses et l'image rose sont préchargées.
 */
export const INTRO_HEAD_SCRIPT = `(function(){var d=document.documentElement,m="skip";try{var u=new URL(location.href),q=u.searchParams.get("intro");if(location.pathname==="/"){if(q==="1"){m="play";u.searchParams.delete("intro");history.replaceState(history.state,"",u.pathname+u.search+u.hash)}else if(q!=="0"){var vu=localStorage.getItem(${JSON.stringify(INTRO_KEY)}),interne=false;try{interne=!!document.referrer&&new URL(document.referrer).origin===location.origin}catch(e){}if(!vu&&!interne&&!/bot|crawl|spider|slurp|facebookexternalhit/i.test(navigator.userAgent))m="play"}}}catch(e){}d.setAttribute("data-intro",m);if(m==="play"){var p=function(h,a,t){var l=document.createElement("link");l.rel="preload";l.as=a;l.href=h;l.type=t;if(a==="font")l.crossOrigin="anonymous";document.head.appendChild(l)};${FONTS.map((f) => `p(${JSON.stringify(f)},"font","font/woff2");`).join("")}p(matchMedia("(max-width: 767px)").matches?${JSON.stringify(ROSE_MOBILE)}:${JSON.stringify(ROSE_DESKTOP)},"image","image/avif")}})();`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** `image-set()` AVIF puis WebP, pour une largeur. */
const imageSet = (name: "hero-rose-mobile" | "hero-rose-desktop", width: number) =>
  `image-set(url(${imageUrl(name, width, "avif")}) type('image/avif'),url(${imageUrl(name, width, "webp")}) type('image/webp'))`;

/**
 * Le faux site rose. Que des `div` et des `span` : aucun titre, aucun lien,
 * rien de cliquable. Les textes viennent de INTRO (lib/content/site.ts).
 */
function scene(): string {
  const [logo, ...rest] = INTRO.nav;
  const cart = rest.pop() ?? "";
  const style = `--rose-m:${imageSet("hero-rose-mobile", 780)};--rose-d:${imageSet("hero-rose-desktop", 1920)};--rose-m-webp:url(${imageUrl("hero-rose-mobile", 780)});--rose-d-webp:url(${imageUrl("hero-rose-desktop", 1920)})`;
  return [
    `<div class="intro-scene" style="${style}">`,
    `<div class="intro-photo"></div>`,
    `<div class="intro-nav"><span class="intro-logo">${esc(logo)}</span><span class="intro-liens">${rest.map((l) => `<span>${esc(l)}</span>`).join("")}</span><span class="intro-panier">${esc(cart)}</span></div>`,
    `<div class="intro-bloc">`,
    `<span class="intro-pastille">${esc(INTRO.badge)}</span>`,
    `<div class="intro-titre">${esc(INTRO.title)}</div>`,
    `<div class="intro-texte">${esc(INTRO.text)}</div>`,
    `<span class="intro-bouton">${esc(INTRO.button)}</span>`,
    `<div class="intro-ligne">${esc(INTRO.line)}</div>`,
    `</div></div>`,
  ].join("");
}

/**
 * Les bandes du glitch : [hauteur en % de l'écran, nombre de passes pendant
 * lesquelles la bande reste rose]. Douze bandes de hauteurs inégales ; quatre
 * passes ; à chaque passe il reste moins de rose (87 % → 67 % → 36 % → 8 %).
 * Les trois bandes fines sont les seules à tenir jusqu'à la dernière passe.
 * Une bande éteinte ne se rallume jamais : aucune zone de l'écran ne clignote.
 */
const BANDS: [number, number][] = [[7, 2], [3, 4], [13, 0], [9, 3], [2.5, 4], [15, 2], [6, 1], [11, 3], [3, 4], [14, 1], [8.5, 2], [8, 3]];

/** Les barres roses pleines qui traversent l'écran : [position en %, épaisseur en px, départ en ms, sens]. */
const BARS: [number, number, number, 1 | -1][] = [[21, 6, 40, 1], [46, 4, 190, -1], [69, 10, 330, 1], [88, 5, 440, -1]];

/** Décalage maximal d'une bande, en fraction de la largeur d'écran, à chacun des huit pas. */
const SHIFT = [0.03, 0.05, 0.08, 0.11, 0.15, 0.2, 0.26, 0.34];

/** Le script du déroulé, à placer juste après `<div id="intro-rose">`. */
export function introBodyScript(): string {
  const cfg = { html: scene(), key: INTRO_KEY, rose: ROSE_MS, glitch: GLITCH_MS, bands: BANDS, bars: BARS, shift: SHIFT };
  // JSON dans une balise <script> : « < » échappé pour qu'aucun texte ne puisse la refermer.
  const json = JSON.stringify(cfg).replace(/</g, "\\u003c");
  // Si le déroulé casse, la couche rose ne doit pas rester à l'écran : on la masque.
  return `try{(${RUNTIME})(${json})}catch(e){document.documentElement.setAttribute("data-intro","skip")}`;
}

/**
 * Le déroulé. JavaScript simple, sans dépendance, écrit pour être lu :
 * il part tel quel dans la page.
 */
const RUNTIME = `function(cfg){
  var d=document.documentElement;
  if(d.getAttribute("data-intro")!=="play")return;
  var shell=document.getElementById("intro-rose");
  if(!shell){d.setAttribute("data-intro","skip");return}
  shell.innerHTML=cfg.html;
  var scene=shell.firstElementChild,started=false,ended=false,timer=0;
  var GESTES=["scroll","wheel","touchstart","pointerdown","keydown"];
  // La couche est inerte : un clic la traverserait et suivrait un lien du site dark. On le retient jusqu'à la fin.
  function retenir(e){e.preventDefault();e.stopPropagation()}
  function fin(){
    if(ended)return;ended=true;
    shell.textContent="";
    d.setAttribute("data-intro","done");
    window.removeEventListener("click",retenir,true);
    try{localStorage.setItem(cfg.key,"1")}catch(e){}
    window.dispatchEvent(new Event("scult:intro-fin"));
  }
  function glitch(){
    if(started)return;started=true;
    clearTimeout(timer);
    GESTES.forEach(function(n){window.removeEventListener(n,glitch,true)});
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){
      // Mouvement réduit : pas de glitch, un fondu de 200 ms.
      d.setAttribute("data-intro","fade");setTimeout(fin,220);return;
    }
    // Une seule lecture de mise en page, avant d'animer ; ensuite, que transform et opacity.
    var W=shell.clientWidth,H=shell.clientHeight,box=document.createElement("div"),y=0,seed=7;
    function alea(){seed=(seed*16807)%2147483647;return seed/2147483647-0.5}
    box.className="intro-tranches";
    cfg.bands.forEach(function(b,i){
      var h=i===cfg.bands.length-1?H-y:Math.round(H*b[0]/100),t=document.createElement("div"),c=scene.cloneNode(true),s="top:"+y+"px;height:"+h+"px;";
      for(var k=0;k<8;k++)s+="--x"+(k+1)+":"+Math.round(alea()*2*cfg.shift[k]*W)+"px;";
      for(var p=2;p<=4;p++)s+="--o"+p+":"+(b[1]>=p?1:0)+";";
      if(b[1]<1)s+="--o1:0;";
      t.className="intro-tranche";t.style.cssText=s;
      c.style.cssText+=";top:"+(-y)+"px;height:"+H+"px";
      t.appendChild(c);box.appendChild(t);y+=h;
    });
    cfg.bars.forEach(function(b){
      var e=document.createElement("div");
      e.className="intro-barre";
      e.style.cssText="top:"+b[0]+"%;height:"+b[1]+"px;animation-delay:"+b[2]+"ms;"+(b[3]<0?"animation-direction:reverse;":"");
      box.appendChild(e);
    });
    shell.replaceChildren(box);
    d.setAttribute("data-intro","glitch");
    setTimeout(fin,cfg.glitch);
  }
  function depart(){
    document.removeEventListener("visibilitychange",depart);
    if(document.hidden){document.addEventListener("visibilitychange",depart);return}
    window.addEventListener("click",retenir,true);
    GESTES.forEach(function(n){window.addEventListener(n,glitch,{capture:true,passive:true})});
    // Le compte à rebours part quand le rose est vraiment à l'écran : polices prêtes (ou 800 ms au plus).
    var go=function(){if(!started&&!timer)timer=setTimeout(glitch,cfg.rose)};
    setTimeout(go,800);
    try{document.fonts.load("1em Pacifico").then(function(){requestAnimationFrame(go)},go)}catch(e){go()}
  }
  depart();
}`;
