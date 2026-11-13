# SCULT — direction artistique (contrat)

Source : `docs/assets/da-ref-1.jpg` (buste de marbre sur bleu Klein, grain,
rubis rouge) et `docs/assets/da-ref-2.jpg` (affiche éditoriale : wordmark
géant, labels mono aux coins, filets fins, photo sombre granuleuse).
Si un visuel ou un composant dérive, on le ramène ici.

## Palette (4 tokens, `app/globals.css`)

| Token | Hex | Rôle |
|---|---|---|
| `--color-klein` | `#1238C7` | couleur de marque, échantillonnée sur la ref 1 — fonds pleine largeur, hero, footer |
| `--color-marble` | `#F2F0EA` | « marbre » : fond des sections produit, texte sur bleu |
| `--color-ink` | `#0B0B0F` | texte courant sur marbre, filets |
| `--color-ruby` | `#D8142B` | **un seul** accent : pastille, prix barré, état actif. Jamais en aplat |

## Typographie

- Titres : **Archivo Black** (`next/font/google`) — wordmark géant façon
  « INSPO » (ref 2), capitales, tracking −0.04em, tailles `clamp(3rem, 12vw, 11rem)`.
  Phrases courtes, point final.
- Labels / métadonnées : **JetBrains Mono** 11–12 px, capitales, tracking
  +0.12em — les « coins » de la ref 2 (`SCULT · 2026 · EU · LOT 001`).
- Courant : **Inter** 16–18 px, interligne 1.6.

## Formes (décidé le 2026-11-13)

**Rien de carré.** Boutons en pilule, cartes et visuels à coins arrondis,
puces rondes. Le rayon vient du pot : bords arrondis, pastille ronde,
cartouche « fruits rouges ». Trois tokens dans `app/globals.css`, et aucun
rayon en dur ailleurs :

| Token | Valeur | Usage |
|---|---|---|
| `--radius-btn` (`rounded-btn`) | 999px | tous les boutons |
| `--radius-card` (`rounded-card`) | 1.5rem | cartes, visuels, grands blocs |
| `--radius-chip` (`rounded-chip`) | 0.75rem | champs, vignettes, encadrés |

Les filets fins de la grille restent droits : ce sont des lignes, pas des
cartes.

## Rythme

Blocs pleine largeur alternés bleu / marbre. Filets 1 px `ink/20` qui
structurent la page en grille (ref 2), labels mono aux quatre coins des
sections hero. Beaucoup de vide autour du produit. Grain fin (`noise.svg` en
overlay 6 %) sur les aplats bleus, jamais sur le texte.

## Photo — bloc « série » (tête de chaque prompt Higgsfield)

> Product photography on a seamless Klein-blue backdrop (#1238C7), hard
> direct sunlight from the upper right casting one sharp shadow, saturated,
> fine film grain, no haze. Chalk-white matte cylindrical tubs with a flat
> screw lid, the SCULT wordmark in heavy black geometric capitals, a small
> ruby-red round seal sticker. Marble sculpture fragments (a hand, a torso,
> a curl of hair) as the only props. No other text.

Un seul fond (Klein), une seule lumière (soleil dur, haut droite), un seul
prop (marbre). Ce qui sort de ça ne rentre pas dans la galerie.

## L'idée forte

**La statue.** Le corps sculpté dans la culture, c'est le marbre grec. Le
produit est posé à côté de fragments de statue, blanc sur bleu, comme un
objet de musée. La hero : un buste de marbre qui regarde le pot. Le footer :
le wordmark géant comme une inscription gravée.

## Ce qu'on ne reprend pas

- Le texte cyrillique et la surcharge de labels de la ref 2 sur mobile (on
  garde 2 coins sur 4 sous 768 px).
- La photo sombre bleu-vert de la ref 2 : la série reste Klein + soleil.
- Aucun chiffre d'efficacité, aucune allégation santé non autorisée (voir
  `ASSUMPTIONS.md`) : la DA porte la promesse, pas la copy.


---

## DA « Cri » — le pré-workout (ajoutée le 2026-11-12)

La gamme nature garde la DA ci-dessus (pots blancs, soleil dur). **CRI a la
sienne**, plus agressive, et c'est elle qui porte l'accueil. Références dans
`docs/da/` (planche, personnage, pot, dos à plat).

### Règles photo
- **Flash direct** type compact 35 mm (Fuji Superia 400), ombre noire portée
  sur le mur, grain visible. À écrire en premier dans chaque prompt, sinon le
  modèle repart sur du soleil.
- **Mur bleu peint** `#1238C7`, peinture légèrement irrégulière. Version nuit :
  bleu qui tombe au noir sur les bords.
- **Statue** : marbre ivoire patiné, brun dans les creux, piqûres, cassures,
  poli brillant seulement sur les reliefs. Jamais de marbre blanc propre.
- Cadre penché, coupé, trop près. Jamais de salle de sport, de peau humaine
  ni de halo.
- Rouge = le strap (poignet droit de la statue, bande du pot) et la pastille.
  Rien d'autre en rouge.

### Le personnage (une seule statue, partout)
Mâchoire carrée, nez cassé à la pointe, front plissé, yeux lisses sans iris,
cheveux en grosses mèches, veine grise sur la joue gauche, **pastille rouge à
la tempe gauche**, **strap rouge au poignet droit**, drapé noué aux hanches.

### Le pot CRI
Pot et couvercle ivoire en un seul dessin continu. Visage de la statue en
trame noire, **CRI** en bleu qui déborde, trois coups de ciseau, strap rouge
en bande d'inviolabilité, signature « Rien ne se sculpte en silence. » sur le
bord du couvercle. Trois encres : noir, bleu, rouge.
- Toujours de face, pot droit, jamais plus qu'un trois-quarts.
- Le dos est composé en vraie typo (`docs/da/05-pot-dos-a-plat.jpg`), jamais
  généré.
- Contrôler les micro-textes à 100 % sur chaque image avant de la publier.

### Références Higgsfield à passer en `medias` (rôle `image_references`)
| Référence | Type | ID |
|---|---|---|
| Pot de face (image maîtresse, à passer en n°1) | job | `3d0c56fb-24dc-465d-99ef-b4a0828ff222` |
| Pot, vues trois-quarts / dos vierge / dessus | job | `a9563ee9-938e-474b-8095-fc655ff909b7` |
| Dos du pot avec mentions | media | `cde61717-df7c-48ff-b9c3-c8743cc20f6b` |
| Personnage, tête et expressions (v3) | job | `8afc6370-6bf2-4823-ac8e-7fbaf753a510` |
| Personnage, corps et détails (v3) | job | `0294ea8c-6727-4304-a0b4-b76cc5370bd0` |
| Tête d'origine (planche C) | job | `4199879e-c657-4e53-ab5c-72c80b0aab6a` |
| Logo SCULT | media | `f976b2a7-57d9-475a-8565-6e7d4b4d2f39` |
| Bannière hero ordinateur | job | `79ff2f69-7c43-48b4-8aad-d0bde395110c` |
| Bannière hero mobile | job | `68978d51-3e04-479f-bf92-b433b6d0f9f1` |
| Slide 2 « la barre », ordinateur | job | `2cf88359-0063-4855-8fce-2ee32b86a7c1` |
| Slide 2 « la barre », mobile | job | `5037de77-fa2d-45b0-86ee-daf80daef81a` |
| Slide 3 « en pied », ordinateur | job | `7b4e1319-25a0-43c9-9fd8-2e7d99adb513` |
| Slide 3 « en pied », mobile | job | `b3b8a6a7-6ce2-4324-8d2d-df7160f2fcc8` |
| Slide 4 « nuit, de dos », ordinateur | job | `b05840f8-9b4e-455f-8954-13eda2616f78` |
| Slide 4 « nuit, de dos », mobile | job | `a194c598-923d-474b-8c69-c1153e92ea01` |
| Pot seul sur bloc de marbre, 4:5 (carte d'achat de l'accueil) | job | `279ecc37-b18f-42dd-a53b-1d657dbb232e` |
| Pot détouré, fond transparent (carte produit de l'accueil) | job | `fb3b7a1e-dc0a-4f07-8a4d-b64a30494850` |
| Section 3, « le visage » (en ligne, slide 2) | job | `1c87e9ae-3bb9-45cc-ba47-97addce1e56f` |
| Section 3, proposition « la craie » (prête) | job | `e67df17b-b3be-4de2-bc9c-310c5c12be76` |
| Section 3, « la dose », 16:9 en 4k : pot ouvert, couvercle conforme (dessus uni, logo, pastille) | job | `cf9653cb-7b7e-4f33-ac32-b07d0a205fa9` |

Modèle utilisé : `gpt_image_2_6`, qualité `high`, résolution `2k`.

### Slider du hero (ajouté le 2026-11-13)
Quatre slides CRI, textes dans `src/lib/content/hero-slides.ts`, visuels dans
`public/home/hero-<n>-16x9.webp` et `-9x16.webp`. Chaque scène garde le sujet
à droite et 40 % de mur vide à gauche pour le titre.
- **Micro-textes** : sur un pot petit dans le cadre, la ligne du couvercle et
  la ligne verticale des dosages sortent fausses (« CRÉATINE 9 G », un mot
  manquant). Correctif qui marche : repasser l'image en référence n°1 avec le
  pot maître en n°2 et « Edit reference image 1. Keep the whole photograph
  strictly identical. The only change: … must read exactly '…' ». Trois
  retouches sur quatre ont réussi du premier coup.
- **À reprendre** : `hero-3-9x16.webp` garde un chiffre douteux sur la ligne
  verticale des dosages (illisible à la taille d'affichage mobile, visible à
  la loupe). La retouche l'a empiré, l'original est conservé.

## Architecture (accueil mono-produit, 2026-11-13)
```
H  Slider plein cadre, 3 scènes CRI (la slide de nuit a été retirée le 2026-11-13)
   Section 2 : carte produit + formule en liste, prix et bouton au deuxième écran
   Section 3 : grand visuel arrondi (le visage qui hurle) + phrase + lien méthode
FAQ courte
```
**Section 2, `src/components/site/Offer.tsx`.** Trois versions le même jour :
1. carte collante + liste de specs + cases de garanties à angles droits —
   rejetée (« ultra générique ») ;
2. « affiche de la dose » : chiffres à l'échelle à gauche, pot au milieu,
   noms à droite — rejetée (« ça n'a pas de sens » : la quantité était séparée
   de son nom par le pot). Seule la carte produit a plu ;
3. la carte produit au centre et les dosages autour, en cartes arrondies —
   rejetée (« j'aime pas du tout ») ;
4. **retenue : simple.** Deux colonnes. D'un côté la carte produit, seule
   pièce dessinée : pot détouré (`public/home/pot-detoure.webp`, job
   `fb3b7a1e-dc0a-4f07-8a4d-b64a30494850`), penché de 5°, ombre dure du flash
   (`.flash-shadow`), prix dans la pastille rouge, bouton en pilule. De
   l'autre, un titre, la liste des sept dosages (nom à gauche, quantité à
   droite), le lien vers la fiche et les trois garanties.
Leçons : l'utilisateur a aimé une seule chose dans tout ça, la carte produit ;
le reste devait rester du texte. Ne pas habiller ce qui n'a pas besoin de
l'être — et voir « Formes » pour les angles.

**Section 2, réglage du 2026-11-13 (soir)** : carte produit agrandie
(colonnes 1,55 / 1), formule réduite à une petite liste et un lien ; les
garanties tiennent en une ligne sous le bouton.

**Section 3, `src/components/site/Statue.tsx`** : l'image de poudre blanche
(ancienne DA) est remplacée par un grand panneau arrondi. Trois visuels
proposés, tous en 16:9, sujet à droite : le visage (retenu par défaut), la
craie, la dose. Sur mobile l'image passe au-dessus du texte dans la même carte.

**Section 3 en slider (2026-11-13, nuit)** : deux slides dans le même panneau
arrondi — 1. le pot ouvert et la mesure de poudre (« Mode d'emploi »), 2. le
visage (« La méthode »). Flèches en pilule, défilement automatique comme le
hero. Pour ajouter une slide : le tableau `SLIDES` de `Statue.tsx`.

**Ajout au panier (2026-11-13)** : un petit pot (`public/home/pot-mini.webp`)
décolle du bouton et file en arc jusqu'au compteur du panier, qui rebondit ;
le bouton passe à « Ajouté ✓ » en bleu, puis le tiroir s'ouvre. Tout est dans
`src/components/cart/AddToCart.tsx` ; rien ne bouge en mouvement réduit.

**Footer (2026-11-13)** — `src/components/site/Footer.tsx`. Retenu après deux
séries de propositions : bleu uni avec un grain léger, le pot détouré en très
grand en arrière-plan (penché, coupé par le bord), le mot SCULT réduit, la
signature, le bouton « Commander », les liens et la mention dans la moitié
gauche. Sur mobile le pot passe sous le texte.

Rejeté en route, à ne pas refaire :
- pieds de statue coupés, mains de craie sur le mur, strap rouge sur marbre —
  « on dirait des trucs de film d'horreur ». Pas de fragments de corps,
  d'empreintes ni d'ambiance sombre dans les décors ;
- la matière de peinture bleue en vagues derrière le pot ;
- le mot SCULT en géant (il doit rester discret à côté du pot).
Non retenues mais jugées correctes : un nuage de poudre rose
(job `16d77222-020a-42eb-af06-68558d3e13bc`) et un tapis de fruits rouges
(job `28c7fa4c-6510-4b6e-baf8-9965bdb62362`), réutilisables ailleurs.

## Le pot en 3D (2026-11-13)

Un modèle construit dans Blender par `scripts/3d/build_pot.py` : solide de
révolution, étiquette à plat enroulée, strap et pastilles en volume. Fichiers
et limites dans `docs/3d/README.md`. Il sert de référence pour tous les angles
du pot : les textes y sont justes par construction, là où une image générée
les réinvente à chaque fois. Étiquette à plat : job Higgsfield
`1c7e4ae5-1b39-4484-acfc-ac367e2d82b2`.

**Section 2 en défilement 3D (essai du 2026-11-13, nuit)** —
`src/components/site/OfferScroll.tsx`. La section fait 250 svh et son contenu
reste collé : le pot 3D, au centre de l'écran dans une grande carte blanche,
fait un tour complet pendant qu'on défile (82 % du parcours), les sept dosages
apparaissent un à un de part et d'autre, puis le pot revient de face et le
bouton d'achat se dévoile. La pastille de prix est visible dès le début. Sur
mobile : un dosage à la fois sous le pot, bouton d'achat toujours en bas. En
mouvement réduit, rien n'est collé et tout est affiché d'emblée. Le pot ne se
saisit plus à la main dans cette section (la page défile par-dessus).

**Slide « mur de pots » (2026-11-13)** — troisième slide de la section 3,
d'après une référence fournie par l'utilisateur (pots serrés en diagonale).
Rendue depuis le modèle 3D par `scripts/3d/render_pattern.py`, pas générée :
les textes sont justes sur chaque pot et ça ne coûte aucun crédit. Pots sur
fond noir (les interstices), texte sur voile bleu à gauche — l'utilisateur a
écarté le fond bleu derrière les pots, puis le fond noir derrière le texte.
Piège rencontré : remplacer une image sans changer son nom laisse l'ancienne
en cache (`next/image`) ; renommer le fichier.

**Décisions du 2026-11-13 (fin de session)**
- **Logo : on garde le wordmark en blocs actuel.** Sept pistes ont été
  montrées (quatre à plat, trois en volume) et écartées ; rien n'en est
  conservé dans le repo. Ne pas rouvrir le sujet sans demande.
- **Slide « mur de pots »** : plus de voile bleu ; sur ordinateur le texte est
  posé directement sur les pots (ombre portée sur les lettres), sur téléphone
  il reste sous l'image.

**Discours performance (2026-11-13)** — demandé « plus appuyé ». Il passe par
les allégations autorisées, jamais par des verbes de promesse : une slide
« Performance » dans le slider du bas (accroche + allégation créatine mot pour
mot), le premier texte du hero, le bandeau, la FAQ, `llms.txt`, la page
Méthode et la fiche produit (alimentées par `lib/content/methode.ts`). Une
section noire dédiée sur l'accueil a été essayée puis retirée (« fait
tache ») : pas de section supplémentaire pour ce message. Voir ASSUMPTIONS [24].

**Vente (2026-11-13)** — pack de 2 à −15 % : cartes illustrées sur la fiche
(`PurchaseOptions.tsx`), encart dans le panier (`CartDrawer.tsx`). Voir
ASSUMPTIONS [23]. Piège revu deux fois ce jour-là : la règle globale
`* { border-color }` écrase `border-<couleur>` et `.grain > *` passe les
enfants en `relative` — utiliser une ombre (`shadow-[0_0_0_2px_…]`) pour un
contour coloré, et ne pas poser `.grain` sur un bloc à enfants en absolu.

**Slider du bas, état au 2026-11-13 (nuit)** — pleine largeur, bord à bord,
sans coins arrondis ni marges (essai demandé par l'utilisateur). Trois
slides : la dose, la performance, le mur de pots ; la slide du visage qui
hurle a été retirée (« j'aime pas »). Une slide peut porter une version
verticale 4:5 pour téléphone (`imageMobile`) : recadrer une image 16:9 dans un
panneau vertical ne laisse pas la place au texte, au sujet et au pot. Celle
de la performance : `public/home/section3-barre-4x5.webp`, job Higgsfield
`45c7f186-432f-47e9-889b-ddf168814b4b`, accent de « BÊTA » corrigé à la main.
**Image de partage** : `src/app/opengraph-image.jpg`, composée à partir du
hero (statue + pot), du logo et de la signature.

**Ton : la performance, pas le règlement (décision du 2026-11-13)** —
l'utilisateur a fait retirer tout le discours « ce que l'Europe autorise à
dire / ce qu'on peut dire, et pas » : « sur aucun site de pré-workout tu vois
ça ». Les allégations autorisées restent, mot pour mot (c'est la seule façon
légale de parler d'effet), mais présentées comme des **bénéfices** : rubrique
« Performance » sur la fiche, page `/methode` retitrée « Pour les séries qui
comptent. » (menu : Performance), source en petit. On n'écrit plus nulle part
ce que la marque « n'a pas le droit » de dire, ni la carte « aucune
allégation ». Cela remplace l'idée de départ de la page Méthode.
Slide « dose » : version verticale téléphone `section3-dose-4x5.webp`, job
Higgsfield `4ccf52dc-e25f-4d1a-9454-3b00c532ac24`, accent corrigé à la main.

**Slide 3 du slider du bas : « le trio sur fond noir » (2026-11-13)** —
d'après une référence fournie par l'utilisateur (trois pots sur un sol noir
miroir). Remplace le mur de pots. Rendu depuis le modèle 3D par
`scripts/3d/render_trio.py` : un pot debout, un penché, un couché, reflets au
sol, fond noir ; une version 16:9 (groupe à droite, texte à gauche) et une 4:5
pour téléphone (pots en bas, texte au-dessus). Aucun crédit, textes exacts.
**Détails d'interface** : les blocs dépliables (FAQ, rubriques de la fiche)
ont une flèche qui se retourne, plus de « + » (`ui/ToggleArrow.tsx`) ;
l'encart « pack » du panier est balayé par le même reflet que les boutons, à
l'apparition puis toutes les 4,5 s (`.card-shine`).

**Slide 3, version retenue (2026-11-13, fin)** — le trio sur **fond blanc**,
pots **cadrés gros** (le noir « ne matchait pas », puis « les pots sont trop
petits »). Les trois pots sont serrés en grappe (un penché derrière, un
debout, un couché devant) pour remplir le cadre ; texte à l'encre et bouton
noir. `render_trio.py … blanc` rend pots et ombres sur fond transparent, posés
ensuite sur du blanc pur — un sol blanc éclairé pour de vrai a la même clarté
que le papier des pots, ils s'y fondent. Fichiers : `section3-trio-16x9.webp`
et `section3-trio-4x5.webp`.
**Panier** : deux pots ajoutés à l'unité deviennent automatiquement un pack
(`applyBundle` dans `CartProvider.tsx`) ; le client paie le prix du pack quel
que soit le chemin.

**Couvercle : le dessus est uni** (2026-11-13) — sur la feuille produit
(`docs/da/04-pot-feuille-reference.jpg`, vue « dessus »), le dessus du
couvercle est en papier ivoire uni, avec le logo SCULT et une pastille rouge ;
seul le bord porte la phrase. La première version de la slide « dose »
montrait un couvercle au dessus illustré : refaite. À préciser dans tout
prompt où le couvercle est posé à plat (« the top of the lid is plain ivory,
only the SCULT wordmark and one red seal dot »).
**Micro-textes : les recomposer plutôt que les faire retoucher.** Une retouche
IA d'une zone abîme souvent la ligne de dosages. Méthode qui marche à tous les
coups : composer la ligne dans la vraie police (JetBrains Mono 600, étroitisée
à 70 %), effacer l'ancienne en reconstituant le papier rangée par rangée, et
poser la nouvelle en fusion « multiply ».

