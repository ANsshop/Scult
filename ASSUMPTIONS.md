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

## Technique
- [06] Polices auto-hébergées via `next/font/local` (fichiers Fontsource OFL dans `src/fonts/`) plutôt que `next/font/google` : le build ne dépend d'aucun appel réseau (Google Fonts était bloqué dans l'environnement de build). Même rendu.
- [07] `PP_MOCK=1` : aucun appel au socle pendant le test. Les 4 fichiers PP (`client`, `catalog/queries`, `orders/pricing`, `orders/actions`) suivent `docs/PP-API-CONTRACT.md` ; `/api/panier` et `/api/orders` n'ont pas été appelés en réel.
- [08] Dépôt de commande : le webhook Stripe appelle `POST /api/orders` avec `externalRef = session.id` ; la déduplication côté socle sur `externalRef` est supposée (à vérifier dans `packages/core/src/orders.ts`).
- [09] Le repo `ANsshop/boutique-template` n'existe pas encore : ce projet en est le premier brouillon (vitrine pure, sans Prisma / admin / auth).
- [10] Repo `ANsshop/scult` non créé (accès lecture seule) : livraison en zip, pas de preview Vercel.
