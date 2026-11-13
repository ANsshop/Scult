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
H  Slider plein cadre, 4 scènes CRI — le produit sous quatre angles
★  « L'affiche de la dose » — section 2, prix et bouton au deuxième écran
I4 Image matière plein cadre — interlude vers la méthode (à reprendre)
FAQ courte
```
**Section 2, `src/components/site/Offer.tsx`.** Première version rejetée le
jour même (« ultra générique ») : carte produit collante + liste de specs +
quatre cases de garanties, c'est-à-dire un gabarit. La version retenue part
des codes du pot :
- **Échelle typographique** : chaque quantité est écrite à la taille de son
  poids dans la dose (`--k` = la taille d'un gramme ; « 8G » remplit sa
  colonne, « 1G » fait un huitième). C'est la preuve et le dessin à la fois.
- **Le pot en travers de la grille** : détouré (`public/home/pot-detoure.webp`,
  job `fb3b7a1e-dc0a-4f07-8a4d-b64a30494850`), penché de 5°, ombre dure du
  flash (`.flash-shadow`), posé sur le « G » du 8 et sur les filets — le
  geste de la ref 2, où le mot passe derrière le sujet.
- **Trois colonnes à filets visibles**, ligne de labels mono en tête, titre
  qui franchit un filet, garanties en pied d'affiche.
- **Les signes du pot** : trois coups de ciseau sur le 8 (`.chisel`), la
  phrase du couvercle en bandeau défilant, la pastille rouge qui porte le prix.
- Le bloc d'achat est un « ticket » à fond plein collé sous le pot.
Règle à garder pour les sections suivantes : une idée tirée de l'objet ou des
refs d'abord, le gabarit ensuite — jamais l'inverse.
