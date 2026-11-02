"use client";

import { useEffect, useState } from "react";
import { esPlan, ORDEN_PLANES, PLANES_CERT, precioCertificado, type PlanCert } from "@/lib/certificado";
import { SelloPlan } from "../certificado/SelloPlan";
import { SelloSii } from "../certificado/SelloSii";
import { VALORIZACION_VACIA, type DatosValorizacion } from "@/lib/valorizacion";
import { Timbre } from "../certificado/Timbre";
import CampoCodigo from "../CampoCodigo";
import { EjemploGold } from "./EjemploGold";

const clp = (n: number) => "$" + n.toLocaleString("es-CL");

// Huella de las respuestas (igual a como las guarda el servidor): sirve para saber si el certificado pagado
// corresponde a lo que la persona tiene hoy en el formulario.
export function clave(d: DatosValorizacion) {
  const x = d as unknown as Record<string, string | undefined>;
  return JSON.stringify(Object.keys(VALORIZACION_VACIA).map((k) => (typeof x[k] === "string" ? x[k]!.slice(0, 80) : "")));
}


export const URL_EJEMPLO = "/api/certificado/ejemplo?v=20261024"; // cambiar «v» al cambiar el formato: evita copias viejas guardadas en el navegador

// Escritorio: los tres certificados al centro de la cabecera de /valoriza.
// Elegir uno lo deja marcado en el formulario del certificado (que aparece al final de la valorización).
const CLAVE_PLAN = "np-plan-certificado";
const EVENTO_PLAN = "np-plan";
export function PlanesCabecera() {
  const [plan, setPlan] = useState<PlanCert>("gold");
  const [aviso, setAviso] = useState(false);
  useEffect(() => { try { const g = localStorage.getItem(CLAVE_PLAN); if (esPlan(g)) setPlan(g); } catch { /* nada */ } }, []);
  function elegir(k: PlanCert) {
    setPlan(k);
    try { localStorage.setItem(CLAVE_PLAN, k); } catch { /* nada */ }
    window.dispatchEvent(new CustomEvent(EVENTO_PLAN, { detail: k }));
    const form = document.querySelector(".cv");
    if (form) form.scrollIntoView({ behavior: "smooth", block: "start" }); else setAviso(true);
  }
  return (
    <div className="pc3">
      <div className="pc3-grid" role="radiogroup" aria-label="Certificados de valorización">
        {ORDEN_PLANES.map((k) => {
          const P = PLANES_CERT[k];
          return (
            <article key={k} className={`pc3-card pc3-${k}${plan === k ? " on" : ""}`}>
              {P.recomendado && <span className="pc3-reco">Recomendada</span>}
              <SelloPlan plan={k} tam={58} />
              <h3>{P.nombre}<span className="pc3-est" aria-hidden="true">{P.estrellas ? "★".repeat(P.estrellas) : ""}</span></h3>
              <span className={`cvp-etq${P.ia ? " ia" : ""}`}>{P.ia && <b>IA</b>}{P.etiqueta}</span>
              <p className="pc3-precio"><strong>{clp(P.lista)}</strong></p>
              {P.prima > 0 ? <p className="pc3-prima">+{Math.round(P.prima * 100)}% al valor si tus documentos coinciden</p> : <p className="pc3-prima neutro">Solo lo que declaras</p>}
              <div className="pc3-acc">
                <button type="button" role="radio" aria-checked={plan === k} className={`btn${plan === k ? "" : " ghost"}`} onClick={() => elegir(k)}>{plan === k ? "✓ Elegida" : `Elegir ${P.nombre}`}</button>
                <a className="pc3-ej" href={`${URL_EJEMPLO}&plan=${k}`} target="_blank" rel="noopener">Ver ejemplo</a>
              </div>
              {k !== "standard" && <span className="pc3-sii" title="Verificado con información del SII"><SelloSii tam={64} /></span>}
            </article>
          );
        })}
      </div>
      <p className="pc3-nota" role="status">{aviso ? `Listo, quedó elegida la ${PLANES_CERT[plan].nombre}. Primero completa la valorización gratis aquí abajo: al final pides tu certificado.` : "Primero calculas gratis cuánto vale tu negocio; el certificado se pide al final."}</p>
    </div>
  );
}

// Celular: los tres certificados como tres botones; al tocar uno se explica en pocas líneas.
export function PlanesMovil() {
  const [plan, setPlan] = useState<PlanCert>("gold");
  const P = PLANES_CERT[plan];
  return (
    <div className="pm">
      <p className="pm-tit">Elige tu certificado</p>
      <div className="pm-botones" role="tablist" aria-label="Tipos de certificado">
        {ORDEN_PLANES.map((k) => {
          const X = PLANES_CERT[k];
          return (
            <button key={k} type="button" role="tab" aria-selected={plan === k} className={`pm-b pm-${k}${plan === k ? " on" : ""}`} onClick={() => setPlan(k)}>
              {X.recomendado && <span className="pm-reco">Recomendada</span>}
              <span className="pm-est" aria-hidden="true">{X.estrellas ? "★".repeat(X.estrellas) : "—"}</span>
              <b>{X.nombre}</b>
              <span className="pm-precio">{clp(X.lista)}</span>
            </button>
          );
        })}
      </div>
      <div className="pm-detalle" role="tabpanel">
        <span className={`cvp-etq${P.ia ? " ia" : ""}`}>{P.ia && <b>IA</b>}{P.etiqueta}</span>
        {plan !== "standard" && <SelloSii tam={28} texto />}
        <p>{P.resumen}</p>
        {P.prima > 0 && <p className="pm-prima">+{Math.round(P.prima * 100)}% al valor si tus documentos coinciden</p>}
        <a className="cv-ver-ejemplo" href={`${URL_EJEMPLO}&plan=${plan}`} target="_blank" rel="noopener">Ver ejemplo {P.nombre}</a>
      </div>
      <p className="pm-nota">Primero calcula gratis; el certificado se pide al final.</p>
    </div>
  );
}

export function Certificado({ datos, cobro, pagado }: { datos: DatosValorizacion; cobro: boolean; pagado: string | null }) {
  const [f, setF] = useState({ nombre: "", correo: "", negocio: "", acepta: false, sitio_web: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [desc, setDesc] = useState<{ codigo: string; monto: number } | null>(null);
  const [plan, setPlan] = useState<PlanCert>("gold"); // Gold preseleccionada: es la recomendada
  useEffect(() => {
    const pl = new URLSearchParams(window.location.search).get("plan");
    let guardado: string | null = null;
    try { guardado = localStorage.getItem(CLAVE_PLAN); } catch { /* nada */ }
    if (esPlan(pl)) { setPlan(pl); try { localStorage.setItem(CLAVE_PLAN, pl); } catch { /* nada */ } } else if (esPlan(guardado)) setPlan(guardado);
    const elegir = (e: Event) => { const x = (e as CustomEvent).detail; if (esPlan(x)) { setPlan(x); setDesc(null); } };
    window.addEventListener(EVENTO_PLAN, elegir);
    return () => window.removeEventListener(EVENTO_PLAN, elegir);
  }, []);
  const final = desc ? desc.monto : precioCertificado(false, plan);

  if (pagado) {
    return (
      <div className="cv">
        <div className="cv-top">
          <Timbre chico />
          <div>
            <strong>Certificado pagado</strong>
            <span>Puedes descargarlo cuando quieras.</span>
          </div>
        </div>
        <a className="btn" href={`/api/certificado/pdf?t=${pagado}`} download>Descargar certificado (PDF)</a>
        <a className="cv-link" href={`/certificado/${pagado}`}>Ver la página del certificado</a>
      </div>
    );
  }

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!f.acepta) { setError("Debes aceptar el uso de tus datos para emitir el certificado."); return; }
    setEnviando(true);
    fetch("/api/valorizacion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) }).catch(() => {});
    try {
      const r = await fetch("/api/certificado", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, datos, plan, codigo: desc?.codigo }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.url) { window.location.href = d.url; return; }
      setError(d.error || "No se pudo preparar el certificado.");
    } catch {
      setError("No hay conexión. Revisa tu internet e inténtalo de nuevo.");
    }
    setEnviando(false);
  }

  const campo = (k: "nombre" | "correo" | "negocio") => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <form className="cv" onSubmit={pedir}>
      <div className="cv-top">
        <Timbre chico />
        <div>
          <strong>Certificado de valorización</strong>
          <span>Certificado por Nico Pacheco, en PDF</span>
        </div>
      </div>
      <EjemploGold url={`${URL_EJEMPLO}&plan=gold`} />
      <div className="cvp-mini" role="radiogroup" aria-label="Elige tu certificado">
        {ORDEN_PLANES.map((k) => {
          const P = PLANES_CERT[k];
          return (
            <button key={k} type="button" role="radio" aria-checked={plan === k} className={`cvp-mini-b cvp-mini-${k}${plan === k ? " on" : ""}`} onClick={() => { setPlan(k); setDesc(null); }}>
              {P.recomendado && <span className="cvp-mini-reco">Recomendada</span>}
              <b>{P.nombre}</b>
              <span>{!cobro ? "Gratis" : clp(P.lista)}</span>
            </button>
          );
        })}
      </div>
      {plan !== "standard" && <p className="cv-nota">Después de pagar subes los documentos desde tu enlace privado; los revisamos y los contrastamos con lo que declaraste en un máximo de 48 horas hábiles. Mientras tanto puedes descargar la versión Standard.</p>}
      {!cobro && <p className="cv-gratis">Gratis durante el lanzamiento</p>}
      <ul className="cv-incluye">
        <li>Valor de referencia con timbre y folio de Nico Pacheco</li>
        <li>Cómo se llega al valor, paso a paso, y contraste con flujos descontados y múltiplo de mercado</li>
        <li>Análisis de las 11 dimensiones: por qué vale cada punto, efecto de las deudas y qué mejorar</li>
        <li>Crecimiento y proyección a 5 años</li>
      </ul>
      <label className="cv-campo">Tu nombre<input required minLength={2} maxLength={120} value={f.nombre} onChange={campo("nombre")} autoComplete="name" /></label>
      <label className="cv-campo">Correo<input required type="email" maxLength={160} value={f.correo} onChange={campo("correo")} autoComplete="email" /></label>
      <label className="cv-campo">Nombre del negocio<input required minLength={2} maxLength={120} value={f.negocio} onChange={campo("negocio")} placeholder="Ej.: Cafetería del Puerto" /></label>
      <input className="sr" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.sitio_web} onChange={(e) => setF((x) => ({ ...x, sitio_web: e.target.value }))} />
      <label className="cv-check">
        <input type="checkbox" checked={f.acepta} onChange={(e) => setF((x) => ({ ...x, acepta: e.target.checked }))} />
        <span>Acepto que Nico Pacheco use estos datos para emitir y enviarme el certificado, y que los guarde mientras dure el servicio. Puedes pedir verlos, corregirlos o borrarlos escribiendo a nikolaspacheco@gmail.com.</span>
      </label>
      {cobro && <CampoCodigo key={plan} productoId={plan} ruta="/api/certificado/codigo" claro onCambio={(r: { codigo: string; total: number } | null) => setDesc(r ? { codigo: r.codigo, monto: r.total } : null)} />}
      <button className="btn" disabled={enviando}>
        {enviando ? "Preparando…" : !cobro || final === 0 ? `Obtener mi valorización ${PLANES_CERT[plan].nombre} gratis` : `Pagar ${clp(final)} con Mercado Pago`}
      </button>
      {error && <p className="pf-error" role="alert">{error}</p>}
      <p className="cv-nota">{plan === "standard" ? "Valor de referencia basado en la información que declaras." : "Valor de referencia basado en lo que declaras, contrastado con tus documentos."} No es una tasación pericial.</p>
    </form>
  );
}
