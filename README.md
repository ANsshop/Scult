# SCULT — scult.eu

Boutique Next.js 16 (App Router, TypeScript strict, Tailwind v4), Stripe Checkout pour encaisser. Depuis le 2026-11-26 elle a **sa propre base et son propre admin** (`/admin` : tableau de bord, commandes, produits et stock, clients, codes promo, réglages). Sans base configurée, elle tourne comme avant sur le catalogue de test ou sur le socle Peptide Partners. Direction artistique : `docs/DA.md`. Hypothèses et limites : `ASSUMPTIONS.md` (points 62 à 69 pour le backend).

## Démarrer

```bash
npm install
cp .env.example .env            # PP_MOCK=1 par défaut : aucun appel réseau
npm run dev                     # http://localhost:3002
```

Visuels de la DA « bouffon » (`public/bouffon/`, versionnés) : `npm run images:bouffon` les régénère depuis leurs sources. Anciens visuels : télécharger `scult-visuels.zip` et le dézipper dans `public/` (il contient `home/`, `products/`, `lifestyle/` et `hero-iso.png` pour la vidéo hero). Créas pub : `scult-ads-crea.zip` → `ads-crea/statics/<angle>/`.

## Base et admin

```bash
npm run db:local                 # un Postgres local, à laisser tourner (données dans .db-local/)
npm run db:migrate               # crée les tables (db/schema.sql) ; se rejoue sans risque
npm run db:seed -- --demo        # le catalogue + 90 jours de fausses commandes pour voir l'admin vivre
npm run db:admin -- vous@exemple.fr "Prénom"      # crée un compte admin, affiche son mot de passe une fois
```

Dans `.env.local` (pas `.env`, que le déploiement Vercel embarque) : `DATABASE_URL` (voir `.env.example`) et `ADMIN_SESSION_SECRET` (`openssl rand -base64 36`). Puis `npm run dev` et http://localhost:3002/admin.

En ligne (Neon) : mettre l'adresse « pooled » dans `DATABASE_URL`, puis `npm run db:migrate`, `npm run db:seed -- --stock=<pots en stock>` (jamais `--demo`), `npm run db:admin`. Le prix de revient se renseigne ensuite dans Produits : sans lui, pas de marge.

## Vérifier

```bash
bash scripts/gate.sh            # allégations interdites (règlement 1924/2006)
npx tsc --noEmit
PP_MOCK=1 npm run build
npm run test:admin              # 36 contrôles de bout en bout du backend et de l'admin (base locale, site lancé sur le port 3010)
```

## Structure

```
src/app/                 pages (accueil, produits/[slug], methode, faq, livraison-retours, légal, checkout)
src/app/admin/           l'admin (connexion, tableau de bord, commandes, produits, clients, promos, réglages) et ses actions
src/components/admin/    ses briques : habillage, tuiles, tableaux, pastilles, graphique des ventes
src/lib/db.ts            l'accès à la base (Postgres)
src/lib/store/           le métier : catalogue, commandes et stock, clients, codes promo, chiffres, mesure d'audience
src/lib/admin/           session et formats de l'admin
db/schema.sql            les tables ; scripts/db/ : base locale, migration, remplissage, comptes
src/lib/pp/client.ts     la porte d'entrée des données pour le site : la base si elle est configurée, sinon le catalogue de test ou le socle
src/lib/catalog/         forme des produits pour les pages
src/lib/orders/          chiffrage (socle + port + TVA) et dépôt de commande via Stripe
src/lib/content/         FAQ (une source pour la page et le JSON-LD), allégations citées
src/lib/seo.ts           JSON-LD Organization / Product / FAQPage / Breadcrumb
public/llms.txt          fiche AEO — doit rester identique aux fiches produit
ads-crea/                angles, hooks, statics composés, script UGC
docs/                    DA, mock du catalogue, brief
```

## Déployer

Voir le skill `boutique-factory` → `references/infra-deploy.md` : GitHub `ANsshop/scult` → Vercel (preview, Deployment Protection désactivée) → VPS AlexHost (`/srv/apps/scult`, systemd port 3002, Caddy) → Cloudflare proxy → marque + clé d'API dans le dashboard PP.
