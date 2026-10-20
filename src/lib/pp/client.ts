import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Le seul fichier qui connaît l'adresse et la clé du socle Peptide Partners.
 * `server-only` : importé depuis un composant client, la compilation échoue —
 * c'est voulu, la clé ne sort jamais du serveur.
 *
 * Forme des données : docs/PP-API-CONTRACT.md (copie du contrat Limitless).
 * Mock local : PP_MOCK=1 → docs/mock/catalogue.json, même forme.
 */

export class PpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "PpError";
  }
}

export type PpImage = { url: string; alt: string; width: number; height: number };

export type PpVariant = {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  available: boolean;
  preorder: { allowed: boolean; eta: string | null };
  weightGrams: number | null;
  unitCount: number;
};

export type PpProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  category: { slug: string; name: string } | null;
  seo: { title: string | null; description: string | null };
  images: PpImage[];
  faqs: { question: string; answer: string }[];
  variants: PpVariant[];
};

export type PpCatalogue = {
  currency: string;
  /** Taux de TVA de la marque, chaîne décimale ("20.00"). "0.00" = prix saisis TTC. */
  vatRate: string;
  researchDisclaimer: string | null;
  updatedAt: string;
  categories: { id: string; slug: string; name: string; description: string | null; position: number }[];
  products: PpProduct[];
};

export type PpCartLine = { sku: string; quantity: number };

export type PpQuote = {
  currency: string;
  lines: { sku: string; name: string; unitPriceCents: number; quantity: number; lineCents: number }[];
  subtotalCents: number;
  discountCents: number;
  promoCode: string | null;
};

export type PpOrderInput = {
  lines: PpCartLine[];
  shippingCents: number;
  promoCode?: string;
  paymentMethod: "stripe" | "manual";
  customer: { email: string; name: string };
  shippingAddress: {
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  externalRef?: string;
};

export type PpOrder = { id: string; reference: string; totalCents: number };

const mock = () => process.env.PP_MOCK === "1";

function base() {
  const url = process.env.PP_API_URL;
  if (!url) throw new PpError(500, "misconfigured", "PP_API_URL manquante.");
  return url.replace(/\/$/, "");
}

function headers() {
  const key = process.env.PP_API_KEY;
  if (!key) throw new PpError(500, "misconfigured", "PP_API_KEY manquante.");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

async function fail(res: Response): Promise<never> {
  let body: { error?: string; message?: string; details?: unknown } = {};
  try {
    body = await res.json();
  } catch {
    /* corps vide */
  }
  throw new PpError(res.status, body.error ?? "unknown", body.message ?? res.statusText, body.details);
}

export async function getCatalogue(): Promise<PpCatalogue> {
  if (mock()) {
    const file = path.join(process.cwd(), "docs/mock/catalogue.json");
    return JSON.parse(await readFile(file, "utf8")) as PpCatalogue;
  }
  // `revalidate` + `tags`, jamais `no-store` : no-store rendrait toutes les
  // pages dynamiques et casserait la prégénération des fiches.
  const res = await fetch(`${base()}/api/catalogue`, {
    headers: headers(),
    next: { revalidate: 60, tags: ["pp-catalogue"] },
  });
  if (!res.ok) return fail(res);
  return res.json();
}

export async function quoteCart(lines: PpCartLine[], promoCode?: string): Promise<PpQuote> {
  if (mock()) {
    const cat = await getCatalogue();
    const bySku = new Map(cat.products.flatMap((p) => p.variants.map((v) => [v.sku, { p, v }] as const)));
    const out = lines.map((l) => {
      const hit = bySku.get(l.sku);
      if (!hit) throw new PpError(404, "unknown_sku", `SKU inconnu : ${l.sku}`);
      return { sku: l.sku, name: hit.p.name, unitPriceCents: hit.v.priceCents, quantity: l.quantity, lineCents: hit.v.priceCents * l.quantity };
    });
    const subtotalCents = out.reduce((s, l) => s + l.lineCents, 0);
    return { currency: cat.currency, lines: out, subtotalCents, discountCents: 0, promoCode: promoCode ?? null };
  }
  const res = await fetch(`${base()}/api/panier`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ lines, promoCode }),
    cache: "no-store",
  });
  if (!res.ok) return fail(res);
  return res.json();
}

export async function createOrder(input: PpOrderInput): Promise<PpOrder> {
  if (mock()) {
    return { id: crypto.randomUUID(), reference: `SCT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, totalCents: 0 };
  }
  const res = await fetch(`${base()}/api/orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
    cache: "no-store",
  });
  if (!res.ok) return fail(res);
  return res.json();
}
