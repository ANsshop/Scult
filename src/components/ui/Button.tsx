import Link from "next/link";
import { cn } from "@/lib/utils";

/** Boutons : pilule rose, texte noir en Anton ; au survol, un reflet de lumière la traverse (`btn-shine`, globals.css). */
const base = "btn-shine inline-flex h-12 items-center justify-center gap-2 rounded-btn px-7 font-display text-[1.05rem] uppercase leading-none tracking-[0.04em] transition-colors";
const variants = {
  rose: "bg-rose text-fond",
  // lien secondaire : un filet, pas d'aplat
  outline: "border border-current text-current hover:border-rose hover:text-rose",
};

export function Button({ variant = "rose", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={cn(base, variants[variant], "disabled:opacity-50", className)} {...props} />;
}

export function ButtonLink({ variant = "rose", className, href, children }: { variant?: keyof typeof variants; className?: string; href: string; children: React.ReactNode }) {
  return <Link href={href} className={cn(base, variants[variant], className)}>{children}</Link>;
}
