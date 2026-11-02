"use client";

import { useEffect, useState } from "react";
import { mesTexto } from "@/lib/carpeta";
import type { DatosValorizacion } from "@/lib/valorizacion";

const clp = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");
type Pub = { token: string; estado: string; ventas12: number; compras12: number; ventasAnt12: number | null; meses: number; ultimo: string; razon: string; nota: string };

const aDatos = (c: Pub | null): Partial<DatosValorizacion> => c ? {
  carpetaToken: c.token, carpetaEstado: c.estado as DatosValorizacion["carpetaEstado"], carpetaVentas12: String(c.ventas12 || ""),
  carpetaCompras12: String(c.compras12 || ""), carpetaVentasAnt12: c.ventasAnt12 ? String(c.ventasAnt12) : "", carpetaMeses: String(c.meses || ""),
  carpetaUltimo: c.ultimo, carpetaRazon: c.razon.slice(0, 80),
} : { carpetaToken: "", carpetaEstado: "", carpetaVentas12: "", carpetaCompras12: "", carpetaVentasAnt12: "", carpetaMeses: "", carpetaUltimo: "", carpetaRazon: "" };

// Carpeta tributaria del SII: el vendedor sube el PDF y las ventas quedan verificadas con sus F29.
export function CarpetaSII({ d, cambiar, compacto = false }: { d: DatosValorizacion; cambiar: (x: Partial<DatosValorizacion>) => void; compacto?: boolean }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [extra, setExtra] = useState({ codigo: "", clave: "" });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [abierto, setAbierto] = useState(!compacto);
  const [nota, setNota] = useState("");

  // Al volver se consulta el estado de la carpeta (si ya fue revisada) y su aviso.
  useEffect(() => {
    if (!d.carpetaToken) return;
    fetch(`/api/carpeta?t=${d.carpetaToken}`).then((r) => r.json()).then((x) => { if (x.carpeta) { setNota(x.carpeta.nota || ""); if (x.carpeta.estado !== d.carpetaEstado) cambiar(aDatos(x.carpeta)); } }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.carpetaToken]);

  async function subir() {
    if (!archivo) return;
    setError(""); setCargando(true);
    try {
      const fd = new FormData();
      fd.append("archivo", archivo); fd.append("acepta", acepta ? "si" : ""); fd.append("codigo", extra.codigo); fd.append("clave", extra.clave);
      const r = await fetch("/api/carpeta", { method: "POST", body: fd });
      const x = await r.json().catch(() => ({}));
      if (r.ok && x.carpeta) { cambiar(aDatos(x.carpeta)); setNota(x.carpeta.nota || ""); setArchivo(null); }
      else setError(x.error || "No se pudo subir la carpeta.");
    } catch { setError("No hay conexión. Inténtalo de nuevo."); }
    setCargando(false);
  }

  const v12 = Number(d.carpetaVentas12) || 0, c12 = Number(d.carpetaCompras12) || 0, meses = Number(d.carpetaMeses) || 0, ant = Number(d.carpetaVentasAnt12) || 0;
  const declarada = Number(d.ventaNeta) || (Number(d.ventaMensual) || 0) / 1.19;
  const dif = v12 && meses && declarada ? declarada / (v12 / meses) - 1 : null;

  if (d.carpetaToken) return (
    <div className={`sii sii-${d.carpetaEstado}`}>
      {d.carpetaEstado === "leida" || d.carpetaEstado === "verificada" ? (
        <>
          <strong className="sii-sello">✓ {dif !== null && Math.abs(dif) > 0.1 ? "Ventas tomadas de lo declarado al SII" : "Ventas verificadas con el SII"}{d.carpetaRazon ? ` · ${d.carpetaRazon}` : ""}</strong>
          <ul className="sii-cifras">
            <li><b>{clp(v12)}</b><span>ventas netas de {meses} meses (hasta {mesTexto(d.carpetaUltimo)})</span></li>
            <li><b>{clp(v12 / meses)}</b><span>promedio mensual</span></li>
            <li><b>{clp(c12 / meses)}</b><span>compras con IVA al mes</span></li>
            {ant > 0 && <li><b>{v12 >= ant ? "+" : ""}{((v12 / ant - 1) * 100).toFixed(1).replace(".", ",")}%</b><span>crecimiento vs. los 12 meses anteriores</span></li>}
          </ul>
          {nota && <p className="sii-aviso">{nota}</p>}
          {dif !== null && Math.abs(dif) > 0.1 && <p className="sii-aviso">La venta que escribiste difiere {Math.round(Math.abs(dif) * 100)}% de la declarada al SII: el valor se calcula con la del SII.</p>}
        </>
      ) : d.carpetaEstado === "rechazada" ? (
        <p><strong>No pudimos usar tu carpeta.</strong> {nota || "Revisa que sea la carpeta «para solicitar créditos» del SII y súbela de nuevo."}</p>
      ) : (
        <p><strong>Recibimos tu carpeta tributaria.</strong> {nota ? `${nota} ` : ""}La revisamos dentro de 1 día hábil y el sello aparecerá aquí. Mientras tanto suma 1 punto. Si la carpeta es de otro RUT (por ejemplo, tu RUT personal y no el de la empresa), quítala y sube la de la empresa.</p>
      )}
      <button type="button" className="doc-link" onClick={() => cambiar(aDatos(null))}>Quitar carpeta</button>
    </div>
  );

  return (
    <section className="sii sii-invita">
      <button type="button" className="sii-cab" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
        <span className="sii-ico" aria-hidden="true">✓</span>
        <span><strong>Verifica tus ventas con el SII</strong><small>Sube tu carpeta tributaria y el valor se calcula con tus ventas reales.</small></span>
        <em>{abierto ? "▴" : "▾"}</em>
      </button>
      {abierto && (
        <div className="sii-cuerpo">
          <ul className="sii-por">
            <li><b>Suma hasta 4 puntos</b> en Estado financiero y Situación tributaria.</li>
            <li><b>Sello «Ventas verificadas con el SII»</b> en tu certificado: es lo primero que mira un comprador o un banco.</li>
            <li><b>Ventas, compras y crecimiento reales</b> de los últimos 24 meses, sin tener que escribirlos.</li>
          </ul>
          <ol className="sii-pasos">
            <li>Entra a <a href="https://www.sii.cl" target="_blank" rel="noopener noreferrer">sii.cl</a> → Servicios online → Situación tributaria → <b>Carpeta tributaria electrónica</b>.</li>
            <li>Elige <b>«Carpeta tributaria para solicitar créditos»</b> (trae los F29 de 24 meses) e ingresa con tu RUT y clave.</li>
            <li>Descarga el PDF y súbelo aquí. Nunca te pediremos tu clave del SII.</li>
          </ol>
          <label className="sii-archivo">
            <input type="file" accept="application/pdf,.pdf" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
            <span className="btn ghost sm">Elegir PDF</span><span>{archivo ? archivo.name : "Ningún archivo elegido"}</span>
          </label>
          <details className="sii-extra">
            <summary>Opcional: código y clave de la carpeta (para verificarla en el SII)</summary>
            <div className="pf-grid">
              <label className="cv-campo">Código<input maxLength={60} value={extra.codigo} onChange={(e) => setExtra((x) => ({ ...x, codigo: e.target.value }))} /></label>
              <label className="cv-campo">Clave de la carpeta<input maxLength={60} value={extra.clave} onChange={(e) => setExtra((x) => ({ ...x, clave: e.target.value }))} /></label>
            </div>
            <small>Son los datos que el SII entrega para que un tercero consulte la carpeta. No es tu clave tributaria.</small>
          </details>
          <label className="cv-check">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
            <span>Autorizo a Nico Pacheco a leer mi carpeta tributaria solo para verificar ventas y compras en esta valorización. Se borra a los 90 días.</span>
          </label>
          <button type="button" className="btn" disabled={!archivo || !acepta || cargando} onClick={subir}>{cargando ? "Leyendo la carpeta…" : "Subir y verificar mis ventas"}</button>
          {error && <p className="pf-error" role="alert">{error}</p>}
        </div>
      )}
    </section>
  );
}
