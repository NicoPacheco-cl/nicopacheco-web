"use client";

import type { Casilla } from "@/lib/consentimientos";

// Casillas de consentimiento separadas por finalidad (ninguna marcada de antemano).
export function Casillas({ lista, marcadas, cambiar }: { lista: Casilla[]; marcadas: string[]; cambiar: (claves: string[]) => void }) {
  const alternar = (k: string) => cambiar(marcadas.includes(k) ? marcadas.filter((x) => x !== k) : [...marcadas, k]);
  const obligatorias = lista.filter((c) => c.obligatoria);
  const opcionales = lista.filter((c) => !c.obligatoria);
  const todas = obligatorias.every((c) => marcadas.includes(c.clave));
  return (
    <div className="cs">
      {obligatorias.map((c) => (
        <label key={c.clave} className={`cs-item${marcadas.includes(c.clave) ? " on" : ""}`}>
          <input type="checkbox" checked={marcadas.includes(c.clave)} onChange={() => alternar(c.clave)} />
          <span><b>{c.titulo}.</b> {c.texto}</span>
        </label>
      ))}
      {obligatorias.length > 2 && (
        <button type="button" className="cs-todas" onClick={() => cambiar(todas ? marcadas.filter((k) => !obligatorias.some((c) => c.clave === k)) : [...new Set([...marcadas, ...obligatorias.map((c) => c.clave)])])}>
          {todas ? "Desmarcar las obligatorias" : "Leí cada punto: marcar todas las obligatorias"}
        </button>
      )}
      {opcionales.length > 0 && <p className="cs-sub">Opcionales (no son necesarias para usar el servicio):</p>}
      {opcionales.map((c) => (
        <label key={c.clave} className={`cs-item opc${marcadas.includes(c.clave) ? " on" : ""}`}>
          <input type="checkbox" checked={marcadas.includes(c.clave)} onChange={() => alternar(c.clave)} />
          <span><b>{c.titulo}.</b> {c.texto}</span>
        </label>
      ))}
    </div>
  );
}

export const faltanObligatorias = (lista: Casilla[], marcadas: string[]) => lista.filter((c) => c.obligatoria && !marcadas.includes(c.clave)).length;
