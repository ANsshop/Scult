"use server";

import { z } from "zod";
import { hasDb } from "@/lib/db";
import { emailReady, sendEmail } from "@/lib/notify/email";
import { getLaunch } from "@/lib/launch";
import { SITE_NAME, siteOrigin } from "@/lib/seo";

export type WaitlistState = { ok: boolean; message: string } | null;

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.string().max(80).regex(/^[a-z0-9._-]*$/).optional(),
  device: z.enum(["mobile", "desktop"]).optional(),
});

/**
 * L'inscription à la liste d'attente (formulaire WaitlistForm). Une adresse,
 * d'où venait la visite, et rien d'autre. Un champ caché que seul un robot
 * remplit (`site`) écarte les inscriptions automatiques sans rien leur dire.
 * La même adresse peut s'inscrire deux fois sans erreur : elle n'est gardée qu'une fois.
 */
export async function joinWaitlistAction(_prev: WaitlistState, form: FormData): Promise<WaitlistState> {
  const done: WaitlistState = { ok: true, message: "C'est noté. Un e-mail, le jour de la sortie." };
  if (String(form.get("site") ?? "") !== "") return done;
  const parsed = schema.safeParse({ email: form.get("email"), source: form.get("source") || undefined, device: form.get("device") || undefined });
  if (!parsed.success) return { ok: false, message: "Cette adresse e-mail n'est pas valide." };
  if (!hasDb()) return { ok: false, message: "Les inscriptions ne sont pas encore ouvertes." };
  try {
    const { joinWaitlist } = await import("@/lib/store/waitlist");
    const state = await joinWaitlist({ email: parsed.data.email, source: parsed.data.source || "direct", device: parsed.data.device });
    if (state === "new" && emailReady()) {
      const { when } = await getLaunch();
      const site = siteOrigin();
      await sendEmail({
        to: parsed.data.email,
        subject: `${SITE_NAME} : tu es sur la liste`,
        text: `C'est noté.\n\nOn t'écrit une fois, le jour de la sortie (${when}). Rien d'autre d'ici là.\n\nTu ne veux plus de cet e-mail ? Réponds « stop » à ce message, ton adresse est effacée.\n\n${SITE_NAME} · ${site}`,
        html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#111"><p><strong>C'est noté.</strong></p><p>On t'écrit une fois, le jour de la sortie (${when}). Rien d'autre d'ici là.</p><p style="color:#666;font-size:13px">Tu ne veux plus de cet e-mail ? Réponds « stop » à ce message, ton adresse est effacée.</p><p style="color:#666;font-size:13px">${SITE_NAME} · <a href="${site}" style="color:#666">${site.replace(/^https?:\/\//, "")}</a></p></div>`,
      });
    }
    return done;
  } catch (error) {
    console.error("[liste d'attente]", error instanceof Error ? error.message : error);
    return { ok: false, message: "L'inscription n'a pas pu être enregistrée. Réessaie dans un instant." };
  }
}
