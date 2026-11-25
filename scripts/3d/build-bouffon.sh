#!/usr/bin/env bash
# Le pot SCULT pré-workout (le « bouffon ») en 3D, d'une seule commande :
#   1. les textures, tirées des photos de .bouffon-src/  → docs/3d/bouffon/textures/
#   2. le modèle web, étiquette réduite à 3072 px        → public/models/pot-scult.glb
#   3. la source Blender et les cinq rendus de contrôle   → docs/3d/bouffon/
#
#   bash scripts/3d/build-bouffon.sh          # tout (trois minutes, à cause des rendus)
#   bash scripts/3d/build-bouffon.sh web      # étapes 1 et 2 seulement (dix secondes)
set -euo pipefail
cd "$(dirname "$0")/../.."
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
MODE="${1:-all}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/tex" "$TMP/out" public/models

node scripts/3d/pot-bouffon-textures.mjs
# Le dos de l'étiquette (composition, ingrédients, précautions), écrit depuis cri-formule.json
node scripts/3d/pot-bouffon-dos.mjs

node -e "
const sharp = require('sharp');
(async () => {
  await sharp('docs/3d/bouffon/textures/wrap.jpg').resize({ width: 3072 }).jpeg({ quality: 86 }).toFile('$TMP/tex/wrap.jpg');
  await sharp('docs/3d/bouffon/textures/lid-top.jpg').resize({ width: 768 }).jpeg({ quality: 80 }).toFile('$TMP/tex/lid-top.jpg');
})();"
"$BLENDER" --background --factory-startup \
  --python scripts/3d/build_pot_bouffon.py -- "$TMP/tex" "$TMP/out" none "$PWD/public/models/pot-scult.glb" > "$TMP/web.log" 2>&1 \
  || { tail -20 "$TMP/web.log"; exit 1; }
grep -q POT_OK "$TMP/web.log" || { tail -20 "$TMP/web.log"; exit 1; }

if [ "$MODE" != "web" ]; then
  "$BLENDER" --background --factory-startup \
    --python scripts/3d/build_pot_bouffon.py -- docs/3d/bouffon/textures docs/3d/bouffon all none > "$TMP/ref.log" 2>&1 \
    || { tail -20 "$TMP/ref.log"; exit 1; }
  grep -q POT_OK "$TMP/ref.log" || { tail -20 "$TMP/ref.log"; exit 1; }
  ls -la docs/3d/bouffon/pot-scult.blend docs/3d/bouffon/renders/
fi

# Les cartes « métal » du rose, posées par la visionneuse au chargement
node scripts/3d/pot-bouffon-metal.mjs

ls -la public/models/pot-scult.glb
SIZE=$(wc -c < public/models/pot-scult.glb)
[ "$SIZE" -le 1500000 ] || { echo "pot-scult.glb dépasse 1,5 Mo ($SIZE octets)"; exit 1; }
