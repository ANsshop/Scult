/**
 * Crée un compte admin, ou change son mot de passe s'il existe.
 *   npm run db:admin -- prenom@exemple.fr "Prénom"            mot de passe tiré au hasard, affiché une seule fois
 *   npm run db:admin -- prenom@exemple.fr "Prénom" "motdepasse"
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";
import { pgOptions } from "./_env.mjs";

const [email, name, given] = process.argv.slice(2);
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Usage : npm run db:admin -- prenom@exemple.fr "Prénom" ["mot de passe"]');
  process.exit(1);
}
if (given && given.length < 10) {
  console.error("✗ mot de passe trop court : 10 caractères au moins.");
  process.exit(1);
}
const password = given || randomBytes(12).toString("base64url");
const client = new pg.Client(pgOptions());
await client.connect();
try {
  await client.query(
    `insert into admin_users (email, name, password_hash) values ($1, $2, $3)
     on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash, is_active = true`,
    [email.toLowerCase(), name || email.split("@")[0], await bcrypt.hash(password, 12)],
  );
  console.log(`✓ compte admin prêt : ${email.toLowerCase()}`);
  if (!given) console.log(`  mot de passe (affiché une seule fois) : ${password}`);
} finally {
  await client.end();
}
