-- La base de SCULT (Postgres : Neon en ligne, Postgres embarqué en local).
-- Ce fichier se rejoue sans risque : tout y est « if not exists ».
--   npm run db:migrate            applique le schéma
--   npm run db:migrate -- --reset efface tout puis l'applique (jamais en production)
--
-- Conventions : montants en centimes d'euro, TTC (la boutique vend TTC) ;
-- dates en timestamptz ; les jours se comptent à l'heure de Paris.

-- — Comptes de l'admin —
create table if not exists admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text not null,
  password_hash text not null,
  is_active     boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now()
);

-- Tentatives de connexion : sert à bloquer après trop d'échecs (partagé entre les instances, contrairement à une mémoire locale).
create table if not exists login_attempts (
  id         bigserial primary key,
  key        text not null,
  ok         boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_key_idx on login_attempts (key, created_at desc);

-- — Catalogue —
create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  description     text not null default '',
  category_slug   text,
  category_name   text,
  seo_title       text,
  seo_description text,
  images          jsonb not null default '[]'::jsonb,   -- [{ url, alt, width, height }]
  position        integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Une variante = un article vendu, reconnu à son SKU.
-- `stock_variant_id` : un pack n'a pas de stock à lui, il puise dans celui d'une autre
-- variante (`unit_count` pots par pack vendu). Son `stock` reste alors à 0 et ne sert pas.
-- `cost_cents` : prix de revient d'une unité vendue (un pack : laisser vide, il se déduit du pot).
create table if not exists variants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references products(id) on delete cascade,
  sku              text not null unique,
  name             text not null,
  price_cents      integer not null check (price_cents >= 0),
  compare_at_cents integer check (compare_at_cents is null or compare_at_cents >= 0),
  cost_cents       integer check (cost_cents is null or cost_cents >= 0),
  stock            integer not null default 0,           -- peut passer sous zéro : une commande payée n'est jamais refusée
  low_stock_at     integer not null default 20 check (low_stock_at >= 0),
  stock_variant_id uuid references variants(id) on delete set null,
  unit_count       integer not null default 1 check (unit_count > 0),
  weight_grams     integer,
  preorder_allowed boolean not null default false,
  preorder_eta     text,
  position         integer not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists variants_product_idx on variants (product_id, position);

-- — Clients : une ligne par adresse e-mail, créée à la première commande —
create table if not exists customers (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,                  -- en minuscules
  name           text not null default '',
  note           text,
  first_order_at timestamptz,
  created_at     timestamptz not null default now()
);

-- — Commandes : elles naissent payées (Stripe confirme, puis la commande est écrite) —
create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique,                -- SCT-XXXXXX
  status           text not null default 'paid'
                   check (status in ('paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  customer_id      uuid references customers(id) on delete set null,
  email            text not null,
  name             text not null default '',
  address_line1    text not null default '',
  address_line2    text,
  postal_code      text not null default '',
  city             text not null default '',
  country_code     text not null default '',
  subtotal_cents   integer not null check (subtotal_cents >= 0),
  discount_cents   integer not null default 0 check (discount_cents >= 0),
  shipping_cents   integer not null default 0 check (shipping_cents >= 0),
  vat_cents        integer not null default 0 check (vat_cents >= 0),
  total_cents      integer not null check (total_cents >= 0),
  cost_cents       integer,                             -- prix de revient des articles, figé à la commande ; null si un coût manquait
  refund_cents     integer not null default 0 check (refund_cents >= 0),
  promo_code       text,
  payment_method   text not null default 'stripe',
  external_ref     text unique,                         -- identifiant de la session Stripe : une session = une commande
  tracking_carrier text,
  tracking_number  text,
  admin_note       text,
  stock_returned   boolean not null default false,      -- le stock de cette commande a été remis en rayon
  created_at       timestamptz not null default now(),
  paid_at          timestamptz not null default now(),
  prepared_at      timestamptz,
  shipped_at       timestamptz,
  delivered_at     timestamptz,
  cancelled_at     timestamptz,
  refunded_at      timestamptz,
  updated_at       timestamptz not null default now()
);
create index if not exists orders_paid_at_idx on orders (paid_at desc);
create index if not exists orders_status_idx on orders (status, paid_at desc);
create index if not exists orders_customer_idx on orders (customer_id, paid_at desc);

create table if not exists order_lines (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders(id) on delete cascade,
  variant_id       uuid references variants(id) on delete set null,
  sku              text not null,
  name             text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  unit_cost_cents  integer,
  quantity         integer not null check (quantity > 0),
  units            integer not null check (units > 0),   -- pots réellement sortis : quantité × pots par article
  line_cents       integer not null check (line_cents >= 0)
);
create index if not exists order_lines_order_idx on order_lines (order_id);
create index if not exists order_lines_sku_idx on order_lines (sku);

-- Le fil d'une commande : payée, préparée, expédiée, note, remboursement… et qui l'a fait.
create table if not exists order_events (
  id         bigserial primary key,
  order_id   uuid not null references orders(id) on delete cascade,
  type       text not null,
  detail     text,
  actor      text,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on order_events (order_id, created_at);

-- Chaque entrée ou sortie de stock. Le compteur `variants.stock` et ce journal bougent dans la même transaction.
create table if not exists stock_movements (
  id          bigserial primary key,
  variant_id  uuid not null references variants(id) on delete cascade,
  order_id    uuid references orders(id) on delete set null,
  delta       integer not null,
  stock_after integer not null,
  reason      text not null check (reason in ('order', 'return', 'restock', 'adjust', 'seed')),
  note        text,
  actor       text,
  created_at  timestamptz not null default now()
);
create index if not exists stock_movements_variant_idx on stock_movements (variant_id, created_at desc);
create index if not exists stock_movements_order_idx on stock_movements (order_id);

-- — Codes promo —
create table if not exists promo_codes (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique,              -- en majuscules
  label              text,
  discount_type      text not null default 'percent' check (discount_type in ('percent', 'fixed')),
  discount_value     integer not null check (discount_value > 0),   -- pourcentage, ou centimes
  min_subtotal_cents integer not null default 0 check (min_subtotal_cents >= 0),
  max_uses           integer check (max_uses is null or max_uses > 0),
  uses_count         integer not null default 0 check (uses_count >= 0),
  starts_at          timestamptz,
  ends_at            timestamptz,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- — Audience : ce que font les visiteurs, pour le taux de conversion —
-- Aucune donnée personnelle : pas d'adresse IP, pas de compte ; `session_id` est un identifiant
-- tiré au hasard dans l'onglet du visiteur, oublié à sa fermeture.
create table if not exists events (
  id         bigserial primary key,
  type       text not null check (type in ('visit', 'product_view', 'add_to_cart', 'checkout_start')),
  session_id text not null,
  path       text,
  sku        text,
  source     text,                                      -- d'où vient la visite : « direct », un site, ou utm_source
  device     text check (device is null or device in ('mobile', 'desktop')),
  created_at timestamptz not null default now()
);
create index if not exists events_created_idx on events (created_at);
create index if not exists events_type_idx on events (type, created_at);

-- — Réglages de la boutique (clé → valeur) —
create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
