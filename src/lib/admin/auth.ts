import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, hasDb } from "@/lib/db";

/**
 * La session de l'admin : un jeton signé (HS256, 12 h) dans un cookie que le
 * navigateur ne montre pas au JavaScript. À chaque page et à chaque action, on
 * revérifie en base que le compte existe encore et qu'il est actif : un compte
 * désactivé perd l'accès tout de suite, pas dans douze heures.
 */

const COOKIE = "scult_admin";
const HOURS = 12;
export const LOGIN_PATH = "/admin/connexion";

export type Admin = { id: string; email: string; name: string };

function secret(): Uint8Array {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET manquante ou trop courte (32 caractères au moins).");
  return new TextEncoder().encode(value);
}

/** L'admin est-il utilisable ? Il lui faut la base et le secret de session. */
export const adminReady = () => hasDb() && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32;

// Comparé quand le compte n'existe pas, pour que la réponse mette le même temps qu'avec un vrai compte.
const DUMMY_HASH = "$2b$12$2WXSoIoCqlaVa5R9G985ROGDE7eQtbAlYUQMyQ4D5DQ8VAEraYxi2";
const MAX_FAILS = 6;
const WINDOW_MINUTES = 15;

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(email: string, password: string, ip: string): Promise<LoginResult> {
  const key = email.trim().toLowerCase();
  // Trop d'échecs récents sur ce compte ou depuis cette adresse : on attend.
  // Chaque échec s'écrit deux fois (une ligne pour le compte, une pour l'adresse) : on compte par clé, et on garde la pire.
  const fails = await db.one<{ n: number }>(
    `select coalesce(max(n), 0)::int as n from (
       select count(*) as n from login_attempts
        where not ok and created_at > now() - make_interval(mins => $3::int) and key in ($1, $2) group by key) t`,
    [`email:${key}`, `ip:${ip}`, WINDOW_MINUTES],
  );
  if ((fails?.n ?? 0) >= MAX_FAILS) return { ok: false, error: `Trop d'essais. Réessayez dans ${WINDOW_MINUTES} minutes.` };

  const user = await db.one<Admin & { password_hash: string; is_active: boolean }>("select id, email, name, password_hash, is_active from admin_users where email = $1", [key]);
  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid || !user.is_active) {
    await db.query("insert into login_attempts (key, ok) values ($1, false), ($2, false)", [`email:${key}`, `ip:${ip}`]);
    return { ok: false, error: "E-mail ou mot de passe incorrect." };
  }
  await db.query("update admin_users set last_login_at = now() where id = $1", [user.id]);
  // Connexion réussie : les échecs de ce compte ne comptent plus. On en profite pour jeter les vieilles lignes.
  await db.query("delete from login_attempts where key = $1 or created_at < now() - interval '2 days'", [`email:${key}`]);

  const token = await new SignJWT({ email: user.email }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime(`${HOURS}h`).sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/admin", maxAge: HOURS * 3600 });
  return { ok: true };
}

export async function logout() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

/** L'admin connecté, ou `null`. Une seule vérification par requête. */
export const currentAdmin = cache(async (): Promise<Admin | null> => {
  if (!adminReady()) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return await db.one<Admin>("select id, email, name from admin_users where id = $1 and is_active", [payload.sub]);
  } catch {
    return null;
  }
});

/** À appeler en tête de chaque page et de chaque action de l'admin. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await currentAdmin();
  if (!admin) redirect(LOGIN_PATH);
  return admin;
}

export async function changePassword(adminId: string, current: string, next: string): Promise<LoginResult> {
  if (next.length < 10) return { ok: false, error: "Mot de passe trop court : 10 caractères au moins." };
  const user = await db.one<{ password_hash: string }>("select password_hash from admin_users where id = $1", [adminId]);
  if (!user || !(await bcrypt.compare(current, user.password_hash))) return { ok: false, error: "Mot de passe actuel incorrect." };
  await db.query("update admin_users set password_hash = $2 where id = $1", [adminId, await bcrypt.hash(next, 12)]);
  return { ok: true };
}
