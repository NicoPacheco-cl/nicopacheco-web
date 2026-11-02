import type { Metadata } from "next";
import { pagosActivos } from "@/lib/pagos-valoriza";
import { PlanesCabecera, PlanesMovil } from "./Certificado";
import { Marco } from "./Marco";
import { Valorizador } from "./Valorizador";

export const metadata: Metadata = {
  title: "Valorización Pyme · Nico Pacheco",
  description: "Calcula cuánto vale tu negocio y descarga un certificado de valorización de Nico Pacheco: flujos descontados, múltiplos de EBITDA y análisis de contexto.",
};

// Se decide al abrir la página: el pago se activa según las claves de Vercel.
export const dynamic = "force-dynamic";

export default function Valoriza() {
  return (
    <Marco>
      <main className="wrap publicar">
        <header className="publicar-cab va-cab2">
          <span className="eyebrow">Valorización Pyme · la primera estimación es gratis</span>
          <h1>El sobreprecio es la razón N° 1 por la que un negocio no se vende.</h1>
          <p className="va-frase2">Con precio de mercado se vende en semanas. Calcula gratis cuánto vale y pon un precio que puedas demostrar.</p>
          <PlanesCabecera />
          <PlanesMovil />
        </header>
        <Valorizador cobro={pagosActivos()} />
      </main>
    </Marco>
  );
}
