"use client";

import { useState } from "react";

export function BotonReintentar({ token, monto }: { token: string; monto: number }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  async function pagar() {
    setError("");
    setEnviando(true);
    try {
      const r = await fetch("/api/certificado/pagar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.url) { window.location.href = d.url; return; }
      setError(d.error || "No se pudo iniciar el pago.");
    } catch {
      setError("No hay conexión. Revisa tu internet e inténtalo de nuevo.");
    }
    setEnviando(false);
  }
  return (
    <>
      <button type="button" className="btn btn-grande" disabled={enviando} onClick={pagar}>
        {enviando ? "Conectando con Mercado Pago…" : `Pagar $${monto.toLocaleString("es-CL")} con Mercado Pago`}
      </button>
      {error && <p className="pf-error" role="alert">{error}</p>}
    </>
  );
}
