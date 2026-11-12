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

Modèle utilisé : `gpt_image_2_6`, qualité `high`, résolution `2k`.
