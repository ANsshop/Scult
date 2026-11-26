/**
 * Lit `.env.local` puis `.env` (sans écraser ce qui est déjà dans l'environnement) et rend l'adresse de la base.
 * En local, sans DATABASE_URL, on vise la base embarquée lancée par `npm run db:local`.
 */
import { existsSync, readFileSync } from "node:fs";

export const LOCAL_PORT = 54329;
export const LOCAL_URL = `postgresql://scult:scult@localhost:${LOCAL_PORT}/scult`;

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || m[1] in process.env) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1.*$/, "$2").replace(/\s+#.*$/, "");
  }
}

export function databaseUrl() {
  return process.env.DATABASE_URL || LOCAL_URL;
}

/** Une base distante se reconnaît à son hôte : on demande alors une confirmation explicite avant d'effacer. */
export function isLocal(url = databaseUrl()) {
  return /@(localhost|127\.0\.0\.1)[:/]/.test(url);
}

/** Options de connexion : les bases en ligne (Neon) exigent TLS. */
export function pgOptions(url = databaseUrl()) {
  return { connectionString: url, ssl: isLocal(url) ? undefined : { rejectUnauthorized: true } };
}
