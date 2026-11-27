import "server-only";
import { db } from "@/lib/db";

/** Les réglages modifiables depuis l'admin, et leur valeur tant que rien n'est enregistré. */
export type Settings = {
  /** Objectif de chiffre d'affaires du mois, en centimes ; 0 = pas d'objectif. */
  monthlyGoalCents: number;
  /** Au-delà de ce délai sans expédition, une commande payée est « en retard ». */
  lateAfterHours: number;
  /** Nombre de jours de stock visé à chaque réassort : sert à proposer une quantité à commander. */
  restockTargetDays: number;
  /** La boutique vend-elle ? Non : le site n'encaisse rien et inscrit sur la liste d'attente. */
  shopOpen: boolean;
  /** Quand sort le produit, tel qu'on l'écrit sur le site (« janvier 2027 »). */
  launchLabel: string;
};
const DEFAULTS: Settings = { monthlyGoalCents: 0, lateAfterHours: 48, restockTargetDays: 60, shopOpen: false, launchLabel: "janvier 2027" };

export async function getSettings(): Promise<Settings> {
  const rows = await db.query<{ key: string; value: unknown }>("select key, value from settings");
  const out = { ...DEFAULTS } as Record<string, unknown>;
  for (const r of rows) if (r.key in DEFAULTS && typeof r.value === typeof (DEFAULTS as Record<string, unknown>)[r.key]) out[r.key] = r.value;
  return out as Settings;
}

export async function saveSettings(patch: Partial<Settings>) {
  for (const [key, value] of Object.entries(patch)) {
    await db.query("insert into settings (key, value) values ($1, $2::jsonb) on conflict (key) do update set value = excluded.value, updated_at = now()", [key, JSON.stringify(value)]);
  }
}
