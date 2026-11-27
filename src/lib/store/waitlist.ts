import "server-only";
import { db } from "@/lib/db";

export type WaitlistRow = { id: string; email: string; source: string | null; device: string | null; created_at: Date; notified_at: Date | null };

/** Inscrit une adresse. Une adresse déjà inscrite ne l'est pas deux fois : `known`. */
export async function joinWaitlist(e: { email: string; source?: string | null; device?: "mobile" | "desktop" | null }): Promise<"new" | "known"> {
  const rows = await db.query<{ id: string }>(
    "insert into waitlist (email, source, device) values ($1, $2, $3) on conflict (email) do nothing returning id",
    [e.email.trim().toLowerCase().slice(0, 254), e.source?.slice(0, 80) ?? null, e.device ?? null],
  );
  return rows.length ? "new" : "known";
}

export async function listWaitlist(limit = 500): Promise<WaitlistRow[]> {
  return db.query<WaitlistRow>("select id, email, source, device, created_at, notified_at from waitlist order by created_at desc limit $1", [limit]);
}

/** Les chiffres de la liste : total, sept derniers jours, aujourd'hui (heure de Paris), et d'où viennent les inscrits. */
export async function waitlistStats() {
  const [totals] = await db.query<{ total: string; week: string; today: string }>(`
    select count(*) as total,
           count(*) filter (where created_at >= now() - interval '7 days') as week,
           count(*) filter (where (created_at at time zone 'Europe/Paris')::date = (now() at time zone 'Europe/Paris')::date) as today
    from waitlist`);
  const sources = await db.query<{ source: string; n: string }>("select coalesce(source, 'direct') as source, count(*) as n from waitlist group by 1 order by count(*) desc, 1 limit 12");
  // Les visites des mêmes sources, pour le taux d'inscription (une visite = une session de la mesure d'audience).
  const visits = await db.query<{ source: string; n: string }>("select coalesce(source, 'direct') as source, count(distinct session_id) as n from events where type = 'visit' group by 1");
  const seen = new Map(visits.map((v) => [v.source, Number(v.n)]));
  return {
    total: Number(totals.total), week: Number(totals.week), today: Number(totals.today),
    sources: sources.map((s) => ({ source: s.source, signups: Number(s.n), visits: seen.get(s.source) ?? 0 })),
  };
}
