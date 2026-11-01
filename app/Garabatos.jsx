// Dibujos de línea a mano alzada alrededor de la foto de "Sobre mí".
const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export default function Garabatos() {
  return (
    <div className="garabatos" aria-hidden="true">
      {/* Velas de bolsa */}
      <svg className="g g-velas" viewBox="0 0 120 70">
        <g {...trazo}>
          <path d="M14 20v40M26 12v38M40 4v34M52 14v40M66 26v36M78 22v30" />
          <rect x="9" y="30" width="10" height="16" />
          <rect x="21" y="20" width="10" height="20" />
          <rect x="35" y="10" width="10" height="18" />
          <rect x="47" y="22" width="10" height="16" />
          <rect x="61" y="36" width="10" height="16" />
          <rect x="73" y="30" width="10" height="12" />
          <path d="M96 18l3 3M99 18l-3 3M104 34h4M106 32v4M2 8h4M4 6v4" />
        </g>
      </svg>

      {/* Barras con flecha */}
      <svg className="g g-barras" viewBox="0 0 110 100">
        <g {...trazo}>
          <path d="M8 4v88h96M4 10l4-6 4 6M98 88l6 4-6 4" />
          <rect x="18" y="58" width="12" height="30" />
          <rect x="38" y="42" width="12" height="46" />
          <rect x="58" y="54" width="12" height="34" />
          <rect x="78" y="30" width="12" height="58" />
          <path d="M18 40c14-14 30 2 46-10s20-14 28-18M86 10l7 1-2 7" />
        </g>
      </svg>

      {/* Alcancía */}
      <svg className="g g-alcancia" viewBox="0 0 120 90">
        <g {...trazo}>
          <path d="M28 30c8-14 30-20 50-16 22 4 32 20 30 34-1 10-8 18-16 22l-2 12h-10l-2-8c-10 2-20 2-30 0l-2 8H34l-2-12c-8-4-14-10-16-18h-8V40h8c2-4 6-8 12-10z" />
          <path d="M28 30l-6-12 14 6M50 22h22M88 44a2 2 0 1 0 0.1 0M112 30c4 2 4 8 0 10" />
          <path d="M6 14l3 3M9 14l-3 3M112 66l3 3M115 66l-3 3" />
        </g>
      </svg>

      {/* Calculadora */}
      <svg className="g g-calc" viewBox="0 0 90 90">
        <g {...trazo} transform="rotate(-18 45 45)">
          <rect x="22" y="12" width="46" height="66" rx="8" />
          <rect x="30" y="20" width="30" height="14" rx="2" />
          <path d="M32 44h6M42 44h6M52 44h6M32 54h6M42 54h6M52 54h6M32 64h6M42 64h6M52 64h6" />
        </g>
        <g {...trazo}>
          <path d="M8 30c-4 4-4 10 0 14M82 22l3 3M85 22l-3 3" />
        </g>
      </svg>

      {/* Gráfico de líneas en cuadrícula */}
      <svg className="g g-linea" viewBox="0 0 120 110">
        <g {...trazo}>
          <path d="M8 4v100h108M4 10l4-6 4 6" />
          <path d="M8 84l24-22 18 12 24-30 18 8 22-28" />
          <path d="M8 98l26-20 20 6 26-26" opacity="0.7" />
        </g>
        <g fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.45">
          <path d="M8 24h108M8 44h108M8 64h108M8 84h108M28 4v100M48 4v100M68 4v100M88 4v100" />
        </g>
      </svg>

      {/* Bolsa de dinero y billetes */}
      <svg className="g g-bolsa" viewBox="0 0 130 100">
        <g {...trazo}>
          <path d="M30 22c-6-8 2-14 10-10 6-6 14-4 16 2 8-2 12 6 6 10" />
          <path d="M34 26h28M36 26C14 40 10 70 22 82c12 10 40 10 52 0 6-6 8-14 6-22" />
          <path d="M46 48v28M52 52c-4-4-12-2-12 3s12 4 12 9-8 7-12 3" />
          <path d="M70 70l46-10 10 18-46 10z" />
          <path d="M74 76l46-10M78 82l46-10" />
          <ellipse cx="98" cy="74" rx="8" ry="5" transform="rotate(-12 98 74)" />
          <path d="M112 30l3 3M115 30l-3 3M120 44h4M122 42v4" />
        </g>
      </svg>
    </div>
  );
}
