import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Boutons : pilule rose, texte noir en petites capitales mono, comme sur l'ancien site.
 * Au survol, le bouton grossit un peu et un reflet de lumière le traverse
 * (`btn-shine`, globals.css) ; sous le doigt ou le clic, il s'enfonce.
 */
const base = "btn-shine inline-flex h-12 items-center justify-center gap-2 rounded-btn px-7 label !text-[0.75rem] font-bold transition-[scale,background-color,color,border-color,box-shadow] duration-200 ease-(--ease-scult) hover:scale-[1.06] active:scale-[0.96] disabled:hover:scale-100 disabled:active:scale-100";
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
