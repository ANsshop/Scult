import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

/**
 * L'accès à la base de SCULT (Postgres). Un seul réservoir de connexions par
 * instance du serveur ; en ligne, DATABASE_URL est l'adresse « pooled » de Neon.
 *
 * `query` et `one` pour une requête seule ; `tx` dès qu'il faut que plusieurs
 * écritures tiennent ensemble (une commande et son stock, par exemple).
 * Les nombres : Postgres rend `count()` et `sum()` en texte — toujours les
 * convertir dans la requête (`::int`).
 */

/** La boutique a-t-elle sa base ? Sinon elle lit le catalogue de test (voir lib/pp/client.ts). */
export const hasDb = () => Boolean(process.env.DATABASE_URL);

const store = globalThis as unknown as { __scultPool?: Pool };

function pool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante (voir .env.example).");
  if (!store.__scultPool) {
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    store.__scultPool = new Pool({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: true }, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 });
    // Une connexion au repos coupée par le serveur ne doit pas faire tomber le processus.
    store.__scultPool.on("error", (e) => console.error("[db]", e.message));
  }
  return store.__scultPool;
}

export type Db = {
  query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<T[]>;
  one<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<T | null>;
};

function wrap(runner: Pool | PoolClient): Db {
  const query = async <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> => (await runner.query<T>(text, params)).rows;
  const one = async <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> => (await query<T>(text, params))[0] ?? null;
  return { query, one };
}

export const db: Db = {
  query: (text, params) => wrap(pool()).query(text, params),
  one: (text, params) => wrap(pool()).one(text, params),
};

/** Tout ou rien : si `fn` échoue, rien n'est écrit. */
export async function tx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("begin");
    const result = await fn(wrap(client));
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
