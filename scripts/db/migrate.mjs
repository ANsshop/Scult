/**
 * Applique db/schema.sql à la base (DATABASE_URL, ou la base locale).
 *   npm run db:migrate
 *   npm run db:migrate -- --reset     efface toutes les tables d'abord ; sur une base en ligne, ajouter --oui-efface-la-base-en-ligne
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import { databaseUrl, isLocal, pgOptions } from "./_env.mjs";

const reset = process.argv.includes("--reset");
if (reset && !isLocal() && !process.argv.includes("--oui-efface-la-base-en-ligne")) {
  console.error("✗ --reset sur une base en ligne : refusé. Ajouter --oui-efface-la-base-en-ligne si c'est vraiment voulu.");
  process.exit(1);
}
const client = new pg.Client(pgOptions());
await client.connect();
try {
  if (reset) {
    // Tout ce que le schéma crée, d'un coup : pas de liste à tenir à jour à la main.
    await client.query("drop schema public cascade; create schema public;");
    console.log("  tables effacées");
  }
  await client.query(readFileSync("db/schema.sql", "utf8"));
  const { rows } = await client.query("select count(*)::int as n from information_schema.tables where table_schema = 'public'");
  console.log(`✓ schéma appliqué sur ${new URL(databaseUrl()).host} (${rows[0].n} tables)`);
} finally {
  await client.end();
}
