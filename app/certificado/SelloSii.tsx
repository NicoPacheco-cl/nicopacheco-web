// Sello propio «Verificado con información del SII» en la web (24 oct 2026, pedido de Nico). Mismo diseño que el del PDF
// (`selloSii()` en lib/certificado-pdf.ts): círculo verde dentado con visto bueno y «SII». Es un sello de Nico Pacheco,
// no el logo oficial del SII (que no se puede usar sin autorización).
export function SelloSii({ tam = 32, texto = false }: { tam?: number; texto?: boolean }) {
  const dientes = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return <circle key={i} cx={50 + Math.cos(a) * 44} cy={50 + Math.sin(a) * 44} r={4.5} />;
  });
  const sello = (
    <svg viewBox="0 0 100 100" width={tam} height={tam} aria-hidden={texto || undefined} role={texto ? undefined : "img"} aria-label={texto ? undefined : "Verificado con información del SII"} className="ssii-svg">
      <g fill="#1e7b57">{dientes}<circle cx="50" cy="50" r="44" /></g>
      <circle cx="50" cy="50" r="37" fill="none" stroke="#fff" strokeWidth="2.5" />
      <path d="M33 44 L45 56 L68 33" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <text x="50" y="80" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff" fontFamily="Arial, Helvetica, sans-serif">SII</text>
    </svg>
  );
  if (!texto) return sello;
  return <span className="ssii">{sello}<span>Verificado con información del SII</span></span>;
}
