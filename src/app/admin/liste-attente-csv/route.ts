import { currentAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";

/** La liste d'attente entière en CSV (e-mail, provenance, appareil, date), pour l'admin connecté. */
export async function GET() {
  if (!(await currentAdmin())) return new Response("Unauthorized", { status: 401 });
  const rows = await db.query<{ email: string; source: string | null; device: string | null; created_at: Date }>("select email, source, device, created_at from waitlist order by created_at");
  // Une cellule qui commence par = + - @ serait lue comme une formule par un tableur : on la désamorce.
  const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? "'" + v : v).replace(/"/g, '""')}"`;
  const csv = ["email,provenance,appareil,inscrit_le", ...rows.map((r) => [cell(r.email), cell(r.source ?? "direct"), cell(r.device ?? ""), cell(r.created_at.toISOString())].join(","))].join("\r\n");
  return new Response("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="scult-liste-attente.csv"', "Cache-Control": "private, no-store" } });
}
