"use client";

// Campos reutilizables del formulario de valorización.
const miles = (v: string) => (v ? Number(v).toLocaleString("es-CL") : "");

export const NOTA_ESTIMACION = "Es una estimación promedio: hay locales con valores superiores e inferiores a esta cifra.";
export function Campo({ label, ayuda, children, ancho, estimacion }: { label: string; ayuda?: string; children: React.ReactNode; ancho?: boolean; estimacion?: boolean }) {
  return (
    <label className={`pf-campo${ancho ? " ancho" : ""}`}>
      <span className="pf-label">{label}</span>
      {children}
      {ayuda && <span className="pf-ayuda">{ayuda}</span>}
      {estimacion && <span className="pf-estimacion">{NOTA_ESTIMACION}</span>}
    </label>
  );
}

export function Pesos({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <span className="pf-pesos">
      <span aria-hidden="true">$</span>
      <input
        inputMode="numeric"
        value={miles(value)}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 13))}
      />
    </span>
  );
}

export function Entero({ value, onChange, placeholder, sufijo }: { value: string; onChange: (v: string) => void; placeholder?: string; sufijo?: string }) {
  return (
    <span className="pf-pesos">
      <input
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 7))}
      />
      {sufijo && <span aria-hidden="true">{sufijo}</span>}
    </span>
  );
}

export function Opciones<T extends string>({
  label, value, onChange, opciones, ayuda,
}: { label: string; value: T | ""; onChange: (v: T) => void; opciones: [T, string][]; ayuda?: string }) {
  return (
    <fieldset className="pf-campo">
      <legend className="pf-label">{label}</legend>
      <div className="pf-opciones">
        {opciones.map(([v, t]) => (
          <button
            key={v}
            type="button"
            className={value === v ? "on" : undefined}
            aria-pressed={value === v}
            onClick={() => onChange(v)}
          >
            {t}
          </button>
        ))}
      </div>
      {ayuda && <span className="pf-ayuda">{ayuda}</span>}
    </fieldset>
  );
}
