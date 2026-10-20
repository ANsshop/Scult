#!/usr/bin/env bash
# Gate de conformité compléments alimentaires : les tournures interdites par le
# règlement (CE) 1924/2006 (allégations non autorisées, promesses d'effet).
# Échoue si un mot apparaît dans le code, les contenus, les meta ou les alt.
set -euo pipefail
cd "$(dirname "$0")/.."
PATTERN='brûle(r|z)? (la|les|des) graisse|br[uû]leur|boost(e|er|ez)?|sculpt(e|er|ez) (ton|votre|le) corps|perte de poids|maigri|minceur|anti-?âge|rajeuni|guéri|soign(e|er)|traite(r|ment)? (la|les|une) (douleur|inflammation|maladie|carence|infection)|prévient|détox|peau plus ferme|articulations? (plus )?souples?|résultats? (visibles?|garantis?)|\+ ?[0-9]+ ?%'
if grep -rniE "$PATTERN" src public/llms.txt docs/mock ads-crea 2>/dev/null | grep -v "scripts/gate.sh"; then
  echo "✗ gate : tournure interdite trouvée ci-dessus."; exit 1
fi
echo "✓ gate : aucune allégation interdite."
