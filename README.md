# SCULT — scult.eu

Boutique vitrine pure (Next.js 16, App Router, TypeScript strict, Tailwind v4) branchée au socle Peptide Partners : catalogue, panier chiffré et commandes viennent de l'API du dashboard, Stripe Checkout encaisse. Zéro base de données, zéro `/admin`, zéro auth. Direction artistique : `docs/DA.md`. Hypothèses et bloquants : `ASSUMPTIONS.md`.

## Démarrer

```bash
npm install
cp .env.example .env            # PP_MOCK=1 par défaut : aucun appel réseau
npm run dev                     # http://localhost:3002
```

Visuels : télécharger `scult-visuels.zip` et le dézipper dans `public/` (il contient `home/`, `products/`, `lifestyle/` et `hero-iso.png` pour la vidéo hero). Créas pub : `scult-ads-crea.zip` → `ads-crea/statics/<angle>/`.

## Vérifier

```bash
bash scripts/gate.sh            # allégations interdites (règlement 1924/2006)
npx tsc --noEmit
PP_MOCK=1 npm run build
```

## Structure

```
src/app/                 pages (accueil, produits/[slug], methode, faq, livraison-retours, légal, checkout)
src/lib/pp/client.ts     le seul fichier qui connaît le socle (PP_API_URL, PP_API_KEY)
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
