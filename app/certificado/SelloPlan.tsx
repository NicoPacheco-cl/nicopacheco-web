import { PLANES_CERT, type PlanCert } from "@/lib/certificado";

// Sello del plan en la web: Standard (azul simple), Gold y Platinum (holograma con brillo animado).
export function SelloPlan({ plan, tam = 64, verificado = true }: { plan: PlanCert; tam?: number; verificado?: boolean }) {
  const P = PLANES_CERT[plan];
  return (
    <span className={`sp sp-${plan}`} style={{ width: tam, height: tam, fontSize: tam / 64 * 10 }} role="img"
      aria-label={`Valorización ${P.nombre}${P.estrellas ? `, ${P.estrellas} ${P.estrellas === 1 ? "estrella" : "estrellas"}` : ""}`}>
      <span className="sp-placa">
        {P.estrellas > 0 && <span className="sp-est" aria-hidden="true">{"★".repeat(P.estrellas)}</span>}
        <b>{P.nombre.toUpperCase()}</b>
        <small>{plan === "standard" ? "sin validación" : verificado ? "verificada" : "por verificar"}</small>
        {P.ia && <span className="sp-ia">IA</span>}
      </span>
    </span>
  );
}
