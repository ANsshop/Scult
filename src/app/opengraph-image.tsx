import { ImageResponse } from "next/og";
export const alt = "SCULT — Whey, créatine, collagène";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#1238C7", color: "#F2F0EA", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 56, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, letterSpacing: 4 }}><span>SCULT · EU</span><span>WHEY · CRÉATINE · COLLAGÈNE</span></div>
        <div style={{ fontSize: 210, fontWeight: 900, letterSpacing: -10, lineHeight: 0.86 }}>SCULT</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24 }}><span>Trois poudres. Rien d&apos;autre.</span><span style={{ background: "#D8142B", padding: "6px 14px" }}>Trio · 79 €</span></div>
      </div>
    ),
    size,
  );
}
