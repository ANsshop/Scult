import type { Metadata } from "next";

/** L'admin de la boutique : jamais indexé, jamais mis en cache. */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin SCULT" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
