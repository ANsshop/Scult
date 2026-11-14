# Le pot CRI en 3D

Un vrai modèle du pot, construit dans Blender par un script — pas une
reconstruction automatique à partir d'une photo.

| Fichier | À quoi il sert |
|---|---|
| `pot-cri.glb` | le modèle pour le web (2,8 Mo, textures comprises) : visionneuse 3D, three.js, `<model-viewer>` |
| `pot-cri.blend` | la source Blender, modifiable (les textures sont liées, dans `textures/`) |
| `textures/wrap.jpg` | l'étiquette à plat, tout le tour du pot (4096 × 1652) : face au centre, dos sur la couture |
| `textures/lid-top.jpg` | le dessus du couvercle, avec le logo |
| `textures/strap.jpg`, `tail.png` | le strap rouge et son bout qui pend |
| `pot-cri-<goût>.glb` / `.blend` | le même pot, étiquette cassis framboise ou ice tea pêche |
| `renders/` | cinq vues de contrôle par pot, une `planche` par pot et `gamme.jpg` (les trois goûts) |

## Sur le site

La carte produit de l'accueil affiche le pot en 3D, à faire tourner à la
souris ou au doigt (`src/components/site/Pot3D.tsx`). Elle charge
`public/models/pot-cri.glb`, une version allégée (1,4 Mo, étiquette à 3072 px)
produite par :

```bash
bash scripts/3d/build-web.sh
```

À relancer après toute modification du modèle ou des textures.

## Refaire le modèle

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python scripts/3d/build_pot.py -- docs/3d/textures docs/3d all
```

Environ deux minutes. Remplacer `all` par `none` pour ne pas rendre d'images,
ou par `turntable` pour sortir en plus 48 images de rotation.

## Les goûts

Un pot par goût : seule l'étiquette change (le nom du goût, écrit dans sa
couleur en face ; la ligne « Saveur … » et les ingrédients au dos).

```bash
node scripts/3d/gouts.mjs                       # étiquettes : textures/wrap-<goût>.jpg, dos-<goût>.jpg et wrap.jpg
node scripts/3d/gouts-visuels.mjs               # visuels du site : public/cri/<version>/, gouts/, models/, image de partage
bash scripts/3d/build-web.sh                    # le modèle de la visionneuse du site
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python scripts/3d/build_pot.py -- docs/3d/textures docs/3d all wrap-ice-tea-peche.jpg pot-cri-ice-tea-peche
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python scripts/3d/render_gamme.py -- docs/3d/renders/gamme.png \
  docs/3d/pot-cri-cassis-framboise.glb docs/3d/pot-cri.glb docs/3d/pot-cri-ice-tea-peche.glb
```

Ajouter un goût : son nom, sa couleur, son arôme et son colorant dans
`src/lib/content/cri-formule.json` (`gouts`), une entrée dans `FLAVOURS`
(`src/lib/content/flavours.ts`) et ses variantes dans le catalogue.
La visionneuse du site ne charge qu'un modèle : pour changer de goût elle
remplace l'étiquette (`public/models/etiquette-<goût>.jpg`, 3072 px). Les sources de l'étiquette sont dans
`sources/` (`face.jpg`, `dos.jpg`, `papier.jpg`, la police du dos).

## Changer la formule

La formule est dans `src/lib/content/cri-formule.json` : tableau, complexe,
ingrédients, mode d'emploi, précautions, ligne de dosages de la face. Le site
et l'étiquette lisent ce fichier. Après une modification :

1. passer `version` à la suivante (`f2` → `f3`) : les visuels changent d'adresse ;
2. `node scripts/3d/gouts.mjs`, puis `node scripts/3d/gouts-visuels.mjs` ;
3. `bash scripts/3d/build-web.sh`, et `build_pot.py` pour les modèles de
   référence ; `render_trio.py` si le visuel des trois pots doit suivre.

Les retouches partent toujours des originaux (`sources/photos/`,
`sources/accueil/`, `sources/face.jpg`, `sources/dos.jpg`), jamais d'une image
déjà retouchée. Les outils sont dans `scripts/3d/retouche.mjs`.

## Lumière des rendus

Les trois scripts de rendu partagent les mêmes réglages (`net()`) : lampes
modérées pour que le papier reste ivoire, contraste relevé, filtre de pixel
serré. Les puissances se règlent sans toucher au code : `SOLEIL`, `DEBOUCHE`,
`MONDE` (gamme), `DESSUS`, `FACE`, `MONDE` (trio), `SAMPLES`, `EXPO`, `LOOK`.

## Ce qui est exact, ce qui ne l'est pas

- **Les textes** sont ceux de l'étiquette : vérifiés un par un sur la face,
  composés en vraie typo pour le dos (`docs/da/05-pot-dos-a-plat.jpg`).
- **Les dimensions** (108 mm de diamètre, 138 mm de haut, couvercle de
  21,5 mm) sont relevées sur les visuels, pas sur un pot réel. Elles se
  changent en tête de `scripts/3d/build_pot.py`.
- **Le dos** porte encore les emplacements vides du brouillon réglementaire
  (responsable UE, QR, code-barres).
- **Le bout du strap** est une languette plate découpée dans une photo : il
  est juste de face, mince vu de profil.
- L'étiquette à plat vient d'une image générée (job Higgsfield
  `1c7e4ae5-1b39-4484-acfc-ac367e2d82b2`), avec un accent corrigé à la main.
  Si le fichier d'impression existe un jour, il remplace `textures/wrap.jpg`.
