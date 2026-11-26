import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/store/orders";
import type { StockLevel } from "@/lib/store/products";

/**
 * Les briques de l'admin : un seul en-tête de page, une seule carte, un seul
 * tableau, une seule pastille de statut. Chaque écran s'en sert — c'est ce
 * qui fait que les marges, les arrondis et les couleurs sont les mêmes partout.
 *
 * Couleurs : le rose est l'accent (action principale, série en cours) ; les
 * états ont leurs propres couleurs, toujours avec une icône et un mot, jamais
 * la couleur seule.
 */

export const INK = { text: "#0b0b0b", soft: "#52514e", muted: "#898781", line: "#e1e0d9" };
export const STATE = { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" };

// — Mise en page —

export function PageHeader({ title, sub, children, back }: { title: string; sub?: ReactNode; children?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 md:mb-8">
      <div className="min-w-0">
        {back && <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 text-[0.8rem] text-doux hover:text-texte"><span aria-hidden>←</span>{back.label}</Link>}
        <h1 className="display text-[clamp(1.75rem,3.2vw,2.5rem)]">{title}</h1>
        {sub && <p className="mt-2.5 text-[0.9rem] text-doux">{sub}</p>}
      </div>
      {children && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function Card({ title, hint, action, children, className, flush = false }: { title?: string; hint?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border bg-white", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-5">
          <div className="min-w-0">
            {title && <h2 className="text-[0.95rem] font-semibold">{title}</h2>}
            {hint && <p className="mt-0.5 text-[0.8rem] text-discret">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={flush ? "pt-4" : "p-5"}>{children}</div>
    </section>
  );
}

/** Le message d'une action, lu dans l'adresse (`?ok=…` ou `?erreur=…`). */
export function Flash({ ok, erreur }: { ok?: string; erreur?: string }) {
  if (!ok && !erreur) return null;
  return (
    <p role="status" className={cn("mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[0.875rem]", erreur ? "border-[#d03b3b]/40 bg-[#d03b3b]/6" : "border-[#0ca30c]/40 bg-[#0ca30c]/6")}>
      <Icon name={erreur ? "alert" : "check"} className="mt-0.5 shrink-0" style={{ color: erreur ? STATE.critical : STATE.good }} />
      <span>{erreur ?? ok}</span>
    </p>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="font-semibold">{title}</p>
      {children && <p className="mx-auto mt-1.5 max-w-sm text-[0.875rem] text-doux">{children}</p>}
    </div>
  );
}

// — Icônes (traits de 1,5 px, 16 px) —

const PATHS: Record<string, string> = {
  check: "M3.5 8.5l3 3 6-7",
  alert: "M8 2.5l6 10.5H2L8 2.5zM8 6.5v3M8 11.2v.3",
  clock: "M8 14A6 6 0 108 2a6 6 0 000 12zM8 4.8V8l2.2 1.4",
  truck: "M1.5 4h8v7h-8zM9.5 6.5h3l2 2.2V11h-5zM4.5 13a1.3 1.3 0 100-2.6 1.3 1.3 0 000 2.6zM11.5 13a1.3 1.3 0 100-2.6 1.3 1.3 0 000 2.6z",
  box: "M2 5l6-3 6 3v6l-6 3-6-3V5zM2 5l6 3 6-3M8 8v6",
  x: "M4 4l8 8M12 4l-8 8",
  undo: "M5.5 3L2.5 6l3 3M2.5 6h6.5a3.5 3.5 0 010 7H6",
  up: "M8 12.5v-9M4.5 7L8 3.5 11.5 7",
  down: "M8 3.5v9M4.5 9L8 12.5 11.5 9",
  flat: "M3 8h10",
};
export function Icon({ name, className, style, size = 16 }: { name: keyof typeof PATHS | string; className?: string; style?: React.CSSProperties; size?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d={PATHS[name] ?? PATHS.flat} />
    </svg>
  );
}

// — Pastilles —

const STATUS: Record<OrderStatus, { label: string; icon: string; color: string }> = {
  paid: { label: "À préparer", icon: "clock", color: STATE.serious },
  preparing: { label: "En préparation", icon: "box", color: "#2f6fdb" },
  shipped: { label: "Expédiée", icon: "truck", color: INK.soft },
  delivered: { label: "Livrée", icon: "check", color: STATE.good },
  cancelled: { label: "Annulée", icon: "x", color: INK.muted },
  refunded: { label: "Remboursée", icon: "undo", color: STATE.critical },
};
/** Le statut d'une commande : une icône colorée et le mot, en encre normale. */
export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status];
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-white py-1 pl-2 pr-2.5 text-[0.78rem] font-medium"><Icon name={s.icon} size={14} style={{ color: s.color }} />{s.label}</span>;
}

const LEVEL: Record<StockLevel, { label: string; icon: string; color: string }> = {
  rupture: { label: "Rupture", icon: "x", color: STATE.critical },
  critique: { label: "Critique", icon: "alert", color: STATE.critical },
  "a-surveiller": { label: "À surveiller", icon: "clock", color: STATE.serious },
  ok: { label: "Confortable", icon: "check", color: STATE.good },
  "sans-vente": { label: "Pas de vente récente", icon: "flat", color: INK.muted },
};
export function StockBadge({ level }: { level: StockLevel }) {
  const s = LEVEL[level];
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-white py-1 pl-2 pr-2.5 text-[0.78rem] font-medium"><Icon name={s.icon} size={14} style={{ color: s.color }} />{s.label}</span>;
}
export const levelColor = (level: StockLevel) => LEVEL[level].color;

export function Tag({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "rose" }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[0.72rem] font-medium", tone === "rose" ? "bg-rose text-noir" : "border bg-white text-doux")}>{children}</span>;
}

// — Chiffres —

/**
 * L'évolution d'un chiffre face à la période de comparaison. `goodWhenUp` : la
 * hausse est-elle une bonne nouvelle ? (non pour un délai, un taux de remboursement)
 * `null` : rien à quoi comparer.
 */
export function Delta({ value, goodWhenUp = true, suffix = " %" }: { value: number | null; goodWhenUp?: boolean; suffix?: string }) {
  if (value === null || !Number.isFinite(value)) return <span className="text-[0.78rem] text-discret">pas de comparaison</span>;
  const flat = Math.abs(value) < 0.05;
  if (flat) return <span className="inline-flex items-center gap-1 text-[0.8rem] font-medium" style={{ color: INK.soft }}><Icon name="flat" size={13} />stable</span>;
  const good = flat ? null : value > 0 === goodWhenUp;
  return (
    <span className="inline-flex items-center gap-1 text-[0.8rem] font-medium tabular-nums" style={{ color: good === null ? INK.soft : good ? "#006300" : "#a82424" }}>
      <Icon name={flat ? "flat" : value > 0 ? "up" : "down"} size={13} />
      {value > 0 ? "+" : value < 0 ? "−" : ""}{new Intl.NumberFormat("fr-FR", { maximumFractionDigits: Math.abs(value) < 10 ? 1 : 0 }).format(Math.abs(value))}{suffix}
    </span>
  );
}

/** Une tuile de chiffre : l'intitulé, la valeur, l'évolution, et une ligne qui dit ce que le chiffre contient. */
export function Stat({ label, value, delta, note, hero = false }: { label: string; value: ReactNode; delta?: ReactNode; note?: ReactNode; hero?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border bg-white p-5">
      <p className="text-[0.8rem] text-doux">{label}</p>
      <p className={cn("mt-2 font-semibold leading-none tracking-tight", hero ? "text-[clamp(2.4rem,4.6vw,3.25rem)]" : "text-[1.7rem]")}>{value}</p>
      {delta && <p className="mt-2.5">{delta}</p>}
      {note && <p className="mt-auto pt-3 text-[0.78rem] leading-snug text-discret">{note}</p>}
    </div>
  );
}

/** Une jauge : le remplissage porte la couleur de l'état, la piste est la même teinte, très claire. */
export function Meter({ ratio, color = "#ff2e93", label }: { ratio: number; color?: string; label: string }) {
  const width = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div role="img" aria-label={label} className="h-2 overflow-hidden rounded-full" style={{ background: `color-mix(in srgb, ${color} 16%, white)` }}>
      <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

/** Une barre découpée en parts (un tout). Deux teintes validées ensemble : rose et bleu. La légende nomme chaque part. */
export const PART_COLORS = ["#ff2e93", "#2f6fdb"];
export function Split({ parts, label }: { parts: { name: string; value: number; display: string }[]; label: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div>
      <div role="img" aria-label={`${label} : ${parts.map((p) => `${p.name} ${p.display}`).join(", ")}`} className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-[#e1e0d9]/60">
        {total > 0 && parts.map((p, i) => p.value > 0 && <div key={p.name} title={`${p.name} : ${p.display}`} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(p.value / total) * 100}%`, background: PART_COLORS[i] }} />)}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.82rem]">
        {parts.map((p, i) => (
          <li key={p.name} className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ background: PART_COLORS[i] }} />
            <span className="text-doux">{p.name}</span>
            <span className="font-medium tabular-nums">{p.display}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// — Tableaux —

export const TABLE = "w-full text-left text-[0.875rem]";
export const TH = "whitespace-nowrap border-b px-5 py-2.5 text-[0.75rem] font-medium text-discret";
export const TD = "border-b px-5 py-3 align-middle";
export const ROW = "transition-colors hover:bg-[#f4f3f0]/70 [&:last-child>td]:border-b-0";
/** Un tableau qui défile dans sa carte sur petit écran, au lieu d'élargir la page. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  const link = "rounded-full border bg-white px-3.5 py-1.5 text-[0.8rem] font-medium hover:border-texte";
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-4 border-t px-5 py-3.5 text-[0.8rem] text-doux">
      <span className="tabular-nums">Page {page} sur {pages}</span>
      <span className="flex gap-2">
        {page > 1 && <Link href={href(page - 1)} className={link}>Précédente</Link>}
        {page < pages && <Link href={href(page + 1)} className={link}>Suivante</Link>}
      </span>
    </nav>
  );
}

// — Formulaires —

export const INPUT = "h-10 w-full rounded-xl border border-texte/25 bg-white px-3 text-[0.9rem] outline-none transition-colors placeholder:text-discret focus:border-rose";
export const BTN = "inline-flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-[0.85rem] font-semibold transition-colors disabled:opacity-50";
export const BTN_PRIMARY = `${BTN} bg-rose text-noir hover:bg-[#ff4aa2]`;
export const BTN_DARK = `${BTN} bg-noir text-white hover:bg-[#2a2a2a]`;
export const BTN_GHOST = `${BTN} border border-texte/25 bg-white hover:border-texte`;
export const BTN_DANGER = `${BTN} border border-[#d03b3b]/50 bg-white text-[#a82424] hover:bg-[#d03b3b]/6`;

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[0.8rem] font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[0.76rem] leading-snug text-discret">{hint}</span>}
    </label>
  );
}

/** Des onglets en liens : l'état est dans l'adresse. */
export function Tabs({ items, current }: { items: { id: string; label: string; href: string; count?: number }[]; current: string }) {
  return (
    <nav aria-label="Filtres" className="flex min-w-0 max-w-full gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {items.map((t) => {
        const on = t.id === current;
        return (
          <Link key={t.id} href={t.href} aria-current={on ? "page" : undefined} className={cn("inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[0.82rem] font-medium transition-colors", on ? "border-noir bg-noir text-white" : "bg-white text-doux hover:border-texte hover:text-texte")}>
            {t.label}
            {t.count !== undefined && <span className={cn("tabular-nums", on ? "text-white/70" : "text-discret")}>{t.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
