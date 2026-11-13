#!/usr/bin/env bash
# Version web du pot 3D : mêmes formes, étiquette réduite à 3072 px de large
# pour un fichier léger. Écrit public/models/pot-cri.glb.
#   bash scripts/3d/build-web.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/tex" "$TMP/out" public/models
cp docs/3d/textures/* "$TMP/tex/"
node -e "
const sharp = require('sharp');
(async () => {
  await sharp('docs/3d/textures/wrap.jpg').resize({ width: 3072 }).jpeg({ quality: 80 }).toFile('$TMP/tex/wrap.jpg');
  await sharp('docs/3d/textures/lid-top.jpg').resize({ width: 768 }).jpeg({ quality: 80 }).toFile('$TMP/tex/lid-top.jpg');
  await sharp('docs/3d/textures/paper.jpg').resize({ width: 256 }).jpeg({ quality: 80 }).toFile('$TMP/tex/paper.jpg');
  await sharp('docs/3d/textures/strap.jpg').resize({ width: 1024 }).jpeg({ quality: 82 }).toFile('$TMP/tex/strap.jpg');
})();"
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python scripts/3d/build_pot.py -- "$TMP/tex" "$TMP/out" none > "$TMP/log.txt" 2>&1 || { tail -20 "$TMP/log.txt"; exit 1; }
cp "$TMP/out/pot-cri.glb" public/models/pot-cri.glb
ls -la public/models/pot-cri.glb
