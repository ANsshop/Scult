import Link from "next/link";
import { cn } from "@/lib/utils";

/** Boutons : pilule rose, texte noir en petites capitales mono, comme sur l'ancien site ; au survol, un reflet de lumière la traverse (`btn-shine`, globals.css). */
const base = "btn-shine inline-flex h-12 items-center justify-center gap-2 rounded-btn px-7 label !text-[0.75rem] font-bold transition-colors";
const variants = {
  rose: "bg-rose text-noir",
  // lien secondaire : un filet, pas d'aplat
  outline: "border border-current text-current hover:border-rose hover:text-rose",
};

export function Button({ variant = "rose", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={cn(base, variants[variant], "disabled:opacity-50", className)} {...props} />;
}

export function ButtonLink({ variant = "rose", className, href, children }: { variant?: keyof typeof variants; className?: string; href: string; children: React.ReactNode }) {
  return <Link href={href} className={cn(base, variants[variant], className)}>{children}</Link>;
}
