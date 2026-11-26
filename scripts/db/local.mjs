/**
 * La base locale : un vrai Postgres, embarqué (paquet `embedded-postgres`), pour développer et tester sans Neon.
 *   npm run db:local        la lance et la garde ouverte (Ctrl+C pour l'arrêter)
 * Données dans .db-local/ (hors du dépôt). Adresse : voir LOCAL_URL dans _env.mjs.
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { LOCAL_PORT } from "./_env.mjs";

const DIR = ".db-local";
const pg = new EmbeddedPostgres({ databaseDir: DIR, user: "scult", password: "scult", port: LOCAL_PORT, persistent: true, onLog: () => {}, onError: (e) => console.error(String(e)) });
const fresh = !existsSync(`${DIR}/PG_VERSION`);
if (fresh) await pg.initialise();
await pg.start();
if (fresh) await pg.createDatabase("scult");
console.log(`✓ base locale prête sur le port ${LOCAL_PORT}${fresh ? " (nouvelle : lancez npm run db:migrate puis npm run db:seed)" : ""}`);
const stop = async () => { await pg.stop().catch(() => {}); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
