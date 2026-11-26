import { redirect } from "next/navigation";
import { Shell } from "@/components/admin/Shell";
import { LOGIN_PATH, adminReady, requireAdmin } from "@/lib/admin/auth";
import { pendingCount } from "@/lib/store/stats";

/** Tout ce qui est sous /admin (sauf la connexion) : il faut être connecté. Chaque page et chaque action le revérifient. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!adminReady()) redirect(LOGIN_PATH);
  const admin = await requireAdmin();
  return <Shell admin={admin} pending={await pendingCount()}>{children}</Shell>;
}
