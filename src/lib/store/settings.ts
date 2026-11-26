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
};
const DEFAULTS: Settings = { monthlyGoalCents: 0, lateAfterHours: 48, restockTargetDays: 60 };

export async function getSettings(): Promise<Settings> {
  const rows = await db.query<{ key: string; value: unknown }>("select key, value from settings");
  const out = { ...DEFAULTS } as Record<string, unknown>;
  for (const r of rows) if (r.key in DEFAULTS && typeof r.value === "number") out[r.key] = r.value;
  return out as Settings;
}

export async function saveSettings(patch: Partial<Settings>) {
  for (const [key, value] of Object.entries(patch)) {
    await db.query("insert into settings (key, value) values ($1, $2::jsonb) on conflict (key) do update set value = excluded.value, updated_at = now()", [key, JSON.stringify(value)]);
  }
}
