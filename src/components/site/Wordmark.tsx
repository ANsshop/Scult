/** Le wordmark en rectangles (public/brand/logo.svg), inline pour hériter de la couleur. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 120" className={className} fill="currentColor" role="img" aria-label="SCULT">
      <rect x="0" y="0" width="96" height="24"/><rect x="0" y="0" width="24" height="72"/><rect x="0" y="48" width="96" height="24"/><rect x="72" y="48" width="24" height="72"/><rect x="0" y="96" width="96" height="24"/>
      <rect x="116" y="0" width="96" height="24"/><rect x="116" y="0" width="24" height="120"/><rect x="116" y="96" width="96" height="24"/>
      <rect x="232" y="0" width="24" height="120"/><rect x="304" y="0" width="24" height="120"/><rect x="232" y="96" width="96" height="24"/>
      <rect x="348" y="0" width="24" height="120"/><rect x="348" y="96" width="96" height="24"/>
      <rect x="464" y="0" width="96" height="24"/><rect x="500" y="0" width="24" height="120"/>
    </svg>
  );
}
