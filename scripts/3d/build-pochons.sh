#!/usr/bin/env bash
# La boîte de pochons de caféine SCULT en 3D, d'une seule commande :
#   1. les textures, tirées de la feuille de référence → docs/3d/pochons/textures/
#      (et les cartes « métal » + l'image fixe         → public/models/)
#   2. le modèle web                                    → public/models/boite-pochons.glb
#   3. la source Blender                                → docs/3d/pochons/boite-pochons.blend
#
#   bash scripts/3d/build-pochons.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/tex" public/models

node scripts/3d/boite-pochons-textures.mjs
# Textures du modèle web, réduites
node -e "
const sharp = require('sharp');
(async () => {
  await sharp('docs/3d/pochons/textures/couvercle.jpg').resize({ width: 1024 }).jpeg({ quality: 84 }).toFile('$TMP/tex/couvercle.jpg');
  await sharp('docs/3d/pochons/textures/dessous.jpg').resize({ width: 768 }).jpeg({ quality: 82 }).toFile('$TMP/tex/dessous.jpg');
  await sharp('docs/3d/pochons/textures/bande.jpg').resize({ width: 2048 }).jpeg({ quality: 84 }).toFile('$TMP/tex/bande.jpg');
})();"
"$BLENDER" --background --factory-startup \
  --python scripts/3d/build_boite_pochons.py -- "$TMP/tex" "$TMP/out" "$PWD/public/models/boite-pochons.glb" > "$TMP/web.log" 2>&1 \
  || { tail -20 "$TMP/web.log"; exit 1; }
grep -q BOITE_OK "$TMP/web.log" || { tail -20 "$TMP/web.log"; exit 1; }
# La source Blender, avec les textures pleine définition
"$BLENDER" --background --factory-startup \
  --python scripts/3d/build_boite_pochons.py -- docs/3d/pochons/textures docs/3d/pochons none > "$TMP/ref.log" 2>&1 \
  || { tail -20 "$TMP/ref.log"; exit 1; }
grep -q BOITE_OK "$TMP/ref.log" || { tail -20 "$TMP/ref.log"; exit 1; }

ls -la public/models/boite-pochons.glb docs/3d/pochons/boite-pochons.blend
SIZE=$(wc -c < public/models/boite-pochons.glb)
[ "$SIZE" -le 1500000 ] || { echo "boite-pochons.glb dépasse 1,5 Mo ($SIZE octets)"; exit 1; }
