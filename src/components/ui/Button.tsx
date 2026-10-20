import Link from "next/link";
import { cn } from "@/lib/utils";

const base = "inline-flex h-12 items-center justify-center gap-2 px-6 label !text-[0.75rem] font-medium transition-colors";
const variants = {
  ink: "bg-ink text-marble hover:bg-klein",
  marble: "bg-marble text-ink hover:bg-white",
  outline: "border border-current text-current hover:bg-ink hover:text-marble hover:border-ink",
};

export function Button({ variant = "ink", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={cn(base, variants[variant], "disabled:opacity-50", className)} {...props} />;
}

export function ButtonLink({ variant = "ink", className, href, children }: { variant?: keyof typeof variants; className?: string; href: string; children: React.ReactNode }) {
  return <Link href={href} className={cn(base, variants[variant], className)}>{children}</Link>;
}
