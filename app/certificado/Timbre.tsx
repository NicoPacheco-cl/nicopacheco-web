// Timbre «Certificado por Nico Pacheco» (el mismo diseño que lleva el PDF).
export function Timbre({ folio, fecha, chico = false }: { folio?: number; fecha?: string; chico?: boolean }) {
  return (
    <svg className={chico ? "timbre chico" : "timbre"} viewBox="0 0 120 120" role="img" aria-label="Certificado por Nico Pacheco">
      <defs>
        <path id="tb-arriba" d="M 18 60 A 42 42 0 0 1 102 60" />
        <path id="tb-abajo" d="M 14 60 A 46 46 0 0 0 106 60" />
      </defs>
      <g transform="rotate(-12 60 60)">
        <circle cx="60" cy="60" r="56" className="tb-fondo" />
        <circle cx="60" cy="60" r="56" className="tb-linea" strokeWidth="2.6" />
        <circle cx="60" cy="60" r="50" className="tb-linea" strokeWidth="0.8" />
        <circle cx="60" cy="60" r="32" className="tb-linea" strokeWidth="1" />
        <text className="tb-arco"><textPath href="#tb-arriba" startOffset="50%" textAnchor="middle">CERTIFICADO POR</textPath></text>
        <text className="tb-arco"><textPath href="#tb-abajo" startOffset="50%" textAnchor="middle">NICO PACHECO</textPath></text>
        <text x="11" y="64" className="tb-arco">★</text>
        <text x="101" y="64" className="tb-arco">★</text>
        <text x="60" y="58" textAnchor="middle" className="tb-sigla">NP</text>
        {folio && <text x="60" y="70" textAnchor="middle" className="tb-folio">N° {folio}</text>}
        {fecha && <text x="60" y="79" textAnchor="middle" className="tb-fecha">{fecha.replace(/ de /g, " ").toUpperCase()}</text>}
      </g>
    </svg>
  );
}
