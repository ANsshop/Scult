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
| `renders/` | cinq vues de contrôle et `planche.jpg` qui les réunit |

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
