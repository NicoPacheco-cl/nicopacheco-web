import type { Metadata } from "next";
import { iaActiva } from "@/lib/ia";
import { pagosActivos } from "@/lib/pagos-valoriza";
import { PlanesCabecera, PlanesMovil } from "./Certificado";
import { Marco } from "./Marco";
import { Valorizador } from "./Valorizador";

export const metadata: Metadata = {
  title: "Valorización Pyme · Nico Pacheco",
  description: "Calcula cuánto vale tu negocio y descarga un certificado de valorización de Nico Pacheco: flujos descontados, múltiplos de EBITDA y análisis de contexto.",
};

// Se decide al abrir la página: al agregar una clave en Vercel, Gold y Platinum se activan sin recompilar.
export const dynamic = "force-dynamic";

export default function Valoriza() {
  const premium = iaActiva();
  return (
    <Marco>
      <main className="wrap publicar">
        <header className="publicar-cab va-cab2">
          <span className="eyebrow">Valorización Pyme · la primera estimación es gratis</span>
          <h1>El sobreprecio es la razón N° 1 por la que un negocio no se vende.</h1>
          <p className="va-frase2">Con precio de mercado se vende en semanas. Calcula gratis cuánto vale y pon un precio que puedas demostrar.</p>
          <PlanesCabecera premium={premium} />
          <PlanesMovil premium={premium} />
        </header>
        <Valorizador cobro={pagosActivos()} premium={premium} />
      </main>
    </Marco>
  );
}
