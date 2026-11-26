"use client";

import { useEffect, useRef, useState } from "react";

export type ChartPoint = { label: string; revenue: number; orders: number };

const INK = { text: "#0b0b0b", soft: "#52514e", muted: "#898781", line: "#e1e0d9" };
const ROSE = "#ff2e93";
const PREV = "#a3a19a";
const H = 260;
const PAD = { top: 12, right: 8, bottom: 26, left: 46 };

const euros = (cents: number, digits = 0) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(cents / 100);

/** Une graduation « ronde » au-dessus du maximum : 1, 2, 2,5 ou 5 fois une puissance de dix, en quatre pas. */
function niceMax(max: number): number {
  if (max <= 0) return 4;
  const step = max / 4;
  const pow = 10 ** Math.floor(Math.log10(step));
  const nice = [1, 2, 2.5, 5, 10].find((m) => m * pow >= step)! * pow;
  return nice * 4;
}

/**
 * Les ventes dans le temps : une colonne rose par jour (ou par heure), et la
 * période de comparaison en ligne grise, sur le même axe.
 * Au survol ou au clavier, une bulle donne les deux valeurs du jour ; le
 * tableau sous le graphique donne tout, sans survol.
 */
export function SalesChart({ points, previous, currentLabel, previousLabel }: { points: ChartPoint[]; previous: ChartPoint[]; currentLabel: string; previousLabel: string }) {
  const box = useRef<HTMLDivElement>(null);
  // La largeur réelle du cadre, mesurée à l'affichage : tant qu'on ne la connaît pas, on réserve la place sans rien tracer.
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = points.length;
  const plotW = width - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(...points.map((p) => p.revenue), ...previous.map((p) => p.revenue), 0) / 100) * 100;
  const slot = plotW / Math.max(n, 1);
  const bar = Math.max(2, Math.min(24, slot - 2));
  const x = (i: number) => PAD.left + slot * i + slot / 2;
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, 1, 2, 3, 4].map((k) => (max / 4) * k);
  // Une étiquette de date tous les « pas » : autant qu'il en tient sans se toucher.
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 70))));
  const line = previous.slice(0, n).map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.revenue).toFixed(1)}`).join(" ");
  const hit = active !== null ? points[active] : null;
  const hitPrev = active !== null ? previous[active] : null;

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.8rem] text-doux">
        <li className="flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ background: ROSE }} />{currentLabel}</li>
        <li className="flex items-center gap-2"><span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: PREV }} />{previousLabel}</li>
      </ul>
      <div ref={box} className="relative w-full min-w-0" onPointerLeave={() => setActive(null)}>
        {width === 0 && <div style={{ height: H }} />}
        {width > 0 && <svg width={width} height={H} role="img" aria-label={`Chiffre d'affaires, ${currentLabel.toLowerCase()}, comparé à ${previousLabel.toLowerCase()}. Le détail est dans le tableau ci-dessous.`} className="block max-w-full">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={INK.line} strokeWidth="1" />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={INK.muted} style={{ fontVariantNumeric: "tabular-nums" }}>{euros(t)}</text>
            </g>
          ))}
          {points.map((p, i) => {
            const top = y(p.revenue);
            const h = PAD.top + plotH - top;
            const r = Math.min(4, bar / 2, h);
            const left = x(i) - bar / 2;
            return (
              <g key={i}>
                {h > 0 && (
                  <path
                    d={`M${left},${PAD.top + plotH} V${top + r} Q${left},${top} ${left + r},${top} H${left + bar - r} Q${left + bar},${top} ${left + bar},${top + r} V${PAD.top + plotH} Z`}
                    fill={ROSE}
                    opacity={active === null || active === i ? 1 : 0.45}
                  />
                )}
                {i % every === 0 && <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={INK.muted}>{p.label}</text>}
              </g>
            );
          })}
          {previous.length > 0 && <path d={line} fill="none" stroke={PREV} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
          {active !== null && hitPrev && <circle cx={x(active)} cy={y(hitPrev.revenue)} r="4" fill={PREV} stroke="#fff" strokeWidth="2" />}
          {/* Les zones de survol : toute la hauteur de chaque jour, pas seulement la colonne */}
          {points.map((p, i) => (
            <rect
              key={i}
              x={PAD.left + slot * i}
              y={PAD.top}
              width={slot}
              height={plotH}
              fill="transparent"
              tabIndex={0}
              aria-label={`${p.label} : ${euros(p.revenue, 2)}, ${p.orders} commande${p.orders > 1 ? "s" : ""}`}
              onPointerEnter={() => setActive(i)}
              onPointerDown={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              style={{ outline: "none" }}
            />
          ))}
        </svg>}
        {hit && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-1 z-10 w-48 rounded-xl border bg-white p-3 text-[0.8rem] shadow-[0_8px_24px_-10px_rgb(0_0_0/0.25)]"
            style={{ left: Math.max(0, Math.min(width - 192, x(active) - 96)) }}
          >
            <p className="text-doux">{hit.label}</p>
            <p className="mt-1.5 flex items-baseline justify-between gap-3"><span className="flex items-center gap-2 text-doux"><span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: ROSE }} />Ventes</span><strong className="tabular-nums">{euros(hit.revenue, 2)}</strong></p>
            <p className="mt-1 flex items-baseline justify-between gap-3"><span className="flex items-center gap-2 text-doux"><span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: PREV }} />Avant</span><strong className="tabular-nums">{hitPrev ? euros(hitPrev.revenue, 2) : "—"}</strong></p>
            <p className="mt-1.5 border-t pt-1.5 text-doux">{hit.orders} commande{hit.orders > 1 ? "s" : ""}</p>
          </div>
        )}
      </div>
      <details className="mt-3 text-[0.82rem]">
        <summary className="cursor-pointer text-doux hover:text-texte">Voir les chiffres en tableau</summary>
        <div className="mt-3 max-h-72 overflow-auto rounded-xl border">
          <table className="w-full text-left tabular-nums">
            <thead className="sticky top-0 bg-white text-discret"><tr><th className="border-b px-3 py-2 font-medium">Date</th><th className="border-b px-3 py-2 text-right font-medium">Ventes</th><th className="border-b px-3 py-2 text-right font-medium">Commandes</th><th className="border-b px-3 py-2 text-right font-medium">Avant</th></tr></thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i}><td className="border-b px-3 py-1.5">{p.label}</td><td className="border-b px-3 py-1.5 text-right">{euros(p.revenue, 2)}</td><td className="border-b px-3 py-1.5 text-right">{p.orders}</td><td className="border-b px-3 py-1.5 text-right text-doux">{previous[i] ? euros(previous[i].revenue, 2) : "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
