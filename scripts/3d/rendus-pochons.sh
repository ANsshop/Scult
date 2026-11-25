#!/usr/bin/env bash
# Les images de la boîte de pochons pour la galerie de sa fiche (/produits/pochons) : quatre vues du modèle 3D, sur fond transparent.
# Les deux autres vues de la galerie (boîte ouverte, pochon seul) viennent de scripts/pochons-planche.mjs.
#   1. Blender rend les vues (docs/3d/pochons/rendus/, non versionné : des PNG lourds)
#   2. on retire le vide autour et on écrit des WebP à deux largeurs dans public/pochons/
#
#   bash scripts/3d/rendus-pochons.sh        (après scripts/3d/build-pochons.sh)
set -euo pipefail
cd "$(dirname "$0")/../.."
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p public/pochons
"$BLENDER" --background docs/3d/pochons/boite-pochons.blend --python scripts/3d/render_boite_pochons.py -- "$TMP" 1300 > "$TMP/log.txt" 2>&1 \
  || { tail -20 "$TMP/log.txt"; exit 1; }
grep -q RENDUS_OK "$TMP/log.txt" || { tail -20 "$TMP/log.txt"; exit 1; }
node -e "
const sharp = require('sharp');
(async () => {
  for (const vue of ['face', 'tranche', 'dos', 'a-plat']) {
    const t = await sharp('$TMP/boite-pochons-' + vue + '.png').trim({ threshold: 2 }).toBuffer({ resolveWithObject: true });
    for (const w of [600, 1100]) await sharp(t.data).resize({ width: Math.min(w, t.info.width) }).webp({ quality: 86, alphaQuality: 92 }).toFile('public/pochons/boite-' + vue + '-' + w + '.webp');
    console.log('  boite-' + vue, t.info.width + ' × ' + t.info.height);
  }
})();"
ls -la public/pochons/
