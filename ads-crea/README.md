# ads-crea — créas publicitaires de SCULT

Copier ce fichier tel quel dans `ads-crea/README.md` du repo de la boutique et
remplir le tableau au fil des générations. Tout ce qui est ici est versionné
avec le site : une créa qui marche se retrouve, une créa qui a échoué aussi.

## Cible et angles

| Angle | Cible | Hook principal | Preuve utilisée |
|---|---|---|---|
| `statue` | 25-40 ans, sport régulier, sensibles au design | « Un corps se sculpte dans le temps. » | DA (marbre), fabrication UE |
| `3g` | pratiquants qui connaissent déjà la créatine | « 3 g. Tous les jours. C'est tout. » | allégation EFSA créatine, 100 portions |
| `lisible` | acheteurs méfiants des marques de compléments | « Lisez le dos avant d'acheter. » | tableau nutritionnel au dos, lot numéroté |

Trois angles minimum. Un angle = une raison d'acheter, pas un format. Mauvais :
"lifestyle", "packshot". Bon : "révisions de nuit", "partiels J-12", "cadeau
étudiant".

## Arborescence

```
ads-crea/
  README.md
  hooks.md                         15 hooks texte, par angle, testables tels quels
  statics/
    <angle>/
      <slug>-<angle>-9x16.png      TikTok / Reels / Stories
      <slug>-<angle>-4x5.png       feed Instagram / Meta
      <slug>-<angle>-1x1.png       Meta carrousel / Pinterest
      source.html                  gabarit du texte composé (le texte n'est jamais généré par l'IA)
  video/
    ugc-<angle>-script.md          3 × 15 s, skill viral-ugc-ad-creator
    ugc-<angle>.mp4                une fois généré (Higgsfield), ≤ 20 Mo
```

## Règles

- Le texte du hook est **composé en post-prod** (sharp / Playwright depuis
  `source.html`) sur un visuel généré sans texte : net, modifiable, dans la
  bonne langue.
- Pas de chiffre inventé, pas d'allégation sans source. Produits RUO : le gate
  du site s'applique aussi ici.
- Un visuel = une idée. Si on a besoin d'une flèche et d'un cercle rouge pour
  expliquer, c'est que l'image ne marche pas.
- Statut par créa dans le tableau ci-dessous : `brouillon` → `validé` →
  `en test` → `gagnant` / `coupé`, avec la date et, si disponible, le CPA.

## Suivi

| Fichier | Angle | Format | Statut | Date | CPA / CTR | Note |
|---|---|---|---|---|---|---|
| statics/statue/scult-statue-{9x16,4x5,1x1}.png | statue | 3 | validé | 2026-10-20 | — | composés via ad.html (Playwright) |
| statics/3g/scult-3g-{9x16,4x5,1x1}.png | 3g | 3 | validé | 2026-10-20 | — | |
| statics/lisible/scult-lisible-{9x16,4x5,1x1}.png | lisible | 3 | validé | 2026-10-20 | — | |
| video/ugc-3g-script.md | 3g | script | brouillon | 2026-10-20 | — | à générer (Seedance) sur accord |


Les PNG sont dans `scult-ads-crea.zip` (livraison du 2026-10-20) — à déposer dans `statics/<angle>/`.
