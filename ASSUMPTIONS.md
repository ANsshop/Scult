# ASSUMPTIONS — SCULT (test boutique-factory, 2026-10-20)

Format : `- [NN] hypothèse — raison`. L'humain valide ou corrige.

## À trancher avant toute vente (bloquant)
- [00] **Conformité compléments alimentaires** — choix utilisateur « on verra après ». Le site n'écrit que les allégations autorisées (règlement UE 432/2012) et `scripts/gate.sh` bloque les tournures interdites, mais la **déclaration DGCCRF (Teleicare)** et la désignation d'une **personne responsable dans l'UE** n'existent pas. Sans ça : pas de mise sur le marché.
- [01] **Entité vendeuse** — placeholders `[à compléter]` dans CGV / mentions légales / confidentialité (raison sociale, SIREN, siège, médiateur, responsable de traitement). Une adresse Wyoming ne peut pas tenir le rôle de personne responsable UE.
- [02] **TVA** — hypothèse TTC + taux marque à 0 dans le socle (`vatRate: "0.00"` dans le mock, comme Arrow). Si l'entité FR est assujettie, passer en HT + 20 % : le code lit `vatRate`, seule la saisie dans le dashboard change.

## Produit
- [03] Catalogue fictif : whey isolate 750 g (39 €), créatine Creapure® 300 g (24 €), collagène marin 300 g (29 €), Trio 79 € (au lieu de 92 €). Prix, grammages et « Creapure® » (marque déposée Alzchem, nécessite un contrat) sont des placeholders de test.
- [04] Packaging généré (pot blanc mat, pastille rouge, mot vertical) : aucun fournisseur consulté. Le visuel précède le produit — à inverser avant vente (la fiche s'aligne sur le sample).
- [05] Franco à 60 € et port FR 5,90 / EU 8,90 / 12,90 : à aligner sur le transporteur réel.

## CRI — pré-workout (ajouté le 2026-11-12)
- [11] **Prix 49 € les 30 doses** — proposé, pas validé. À recaler sur le coût de revient du fabricant.
- [12] **Nom « CRI »** — nom de travail validé en image, pas vérifié à l'INPI pour les compléments alimentaires. À faire avant impression.
- [13] **Formule cible, pas formule fabricant** — dosages par dose de 23 g issus de la V2 (citrulline 8 g, bêta-alanine 4 g, créatine 3 g, tyrosine 2 g, taurine 1 g, théanine 200 mg, caféine 150 mg, sodium 500 mg, potassium 300 mg, B5 et B6 à 100 % VNR). La **liste d'ingrédients** (ordre, arôme, édulcorant, colorant, anti-agglomérant) est une estimation : elle se remplace par celle du façonnier dans `src/lib/content/product-info.ts`, `public/llms.txt`, la FAQ et le dos du pot.
- [14] **Saveur « Fruits rouges »** — choix provisoire, une seule saveur au lancement.
- [15] **Signature « Rien ne se sculpte en silence. »** — passe le gate (aucune promesse sur le corps), mais à faire relire avec le reste de l'étiquetage : elle joue sur le nom de la marque.
- [16] **Mentions du dos du pot** — brouillon réglementaire (`docs/da/05-pot-dos-a-plat.jpg`) : responsable UE à compléter, QR d'analyse du lot, code-barres et logo Triman / info-tri sont des emplacements vides. La mention caféine doit aussi figurer en face avant, près du nom : elle n'est pas encore sur la maquette de face.
- [17] **Visuels CRI = maquettes générées** — le pot n'existe pas. `public/lifestyle/cri-01.webp` a une répétition abîmée de la phrase du couvercle : à retoucher (recoller l'habillage exact) avant mise en ligne. Les deux bannières hero ont été vérifiées, textes du pot justes.
- [18] **Boutique mono-produit** — tranché le 2026-11-13 : le site ne vend que CRI. Whey, créatine, collagène et Trio restent dans `docs/mock/catalogue.json` mais ne sont plus affichés ni vendus (`STOREFRONT_SLUGS` dans `src/lib/catalog/queries.ts` : leurs fiches renvoient 404, le sitemap, `llms.txt`, la FAQ et la page Méthode ne parlent plus que de CRI). Pour rouvrir une référence : ajouter son slug, puis remettre son contenu.
- [19] **Stock et poids CRI** fictifs dans le mock (100 unités, 780 g expédié).
- [20] **Franco à 60 € pour un pot à 49 €** — avec un seul produit, la livraison offerte ne s'atteint qu'à deux pots. À trancher : baisser le seuil, ou vendre un lot de deux.
- [23] **Pack de 2 à −15 %** (ajouté le 2026-11-13) — 83,30 € au lieu de 98 €, proposé sur la fiche CRI. Dans le mock c'est le produit `cri-duo` (SKU `SCULT-CRI-690-FR-X2`, `unitCount` 2). **À créer à l'identique dans le socle** avant mise en ligne : le prix est lu là-bas, et le lien fiche → pack est dans `BUNDLE_OF` (`src/lib/catalog/queries.ts`). Il dépasse le franco de 60 € : c'est la réponse à l'hypothèse [20]. Stock, poids et prix restent à valider.
- [24] **Discours « performance »** (2026-11-13) — demandé plus appuyé. Il repose sur quatre allégations du registre européen, citées mot pour mot : créatine (capacités physiques, 3 g/j), potassium (fonction musculaire, 300 mg = 15 % VNR), acide pantothénique (métabolisme énergétique), vitamine B6 (fatigue). **À faire relire par la personne en charge du réglementaire** avant mise en ligne : conditions d'emploi de chaque allégation sur la formule réelle du façonnier (le potassium est pile au seuil « source de »), et l'accroche de la slide Performance (« Pour les séries qui comptent. »). Aucun verbe interdit n'est utilisé ; `scripts/gate.sh` passe.
- [21] **Textes de l'accueil proposés, pas validés** — titres des slides 2 à 4 (`src/lib/content/hero-slides.ts`) et de la section « La formule », notes par ingrédient (`src/lib/content/formula.ts`). Le « 1,63 € la dose » est calculé (prix ÷ 30 doses) : il suit le prix du socle.

## Technique
- [22] **Dépendance hors liste : `@google/model-viewer`** (et `three`, sa dépendance) — pour le pot 3D à faire tourner dans la carte produit de l'accueil. Chargée seulement à l'approche de la carte, jamais au premier affichage ; sans elle, l'image fixe du pot reste en place.
- [06] Polices auto-hébergées via `next/font/local` (fichiers Fontsource OFL dans `src/fonts/`) plutôt que `next/font/google` : le build ne dépend d'aucun appel réseau (Google Fonts était bloqué dans l'environnement de build). Même rendu.
- [07] `PP_MOCK=1` : aucun appel au socle pendant le test. Les 4 fichiers PP (`client`, `catalog/queries`, `orders/pricing`, `orders/actions`) suivent `docs/PP-API-CONTRACT.md` ; `/api/panier` et `/api/orders` n'ont pas été appelés en réel.
- [08] Dépôt de commande : le webhook Stripe appelle `POST /api/orders` avec `externalRef = session.id` ; la déduplication côté socle sur `externalRef` est supposée (à vérifier dans `packages/core/src/orders.ts`).
- [09] Le repo `ANsshop/boutique-template` n'existe pas encore : ce projet en est le premier brouillon (vitrine pure, sans Prisma / admin / auth).
- [10] Repo `ANsshop/Scult` : en ligne et public depuis le 2026-10-20. La mise à jour CRI est sur la branche `cri-preworkout`.
