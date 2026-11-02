"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DOCS_CERT, PLANES_CERT, type PlanCert, type TipoDocCert } from "@/lib/certificado";
import { VALORIZACION_VACIA } from "@/lib/valorizacion";
import { CarpetaSII } from "../../valoriza/CarpetaSII";
import { Casillas, faltanObligatorias } from "../../Casillas";
import { CASILLAS_CERT_DOCS } from "@/lib/consentimientos";

type Archivo = { path: string; nombre: string };
const clp = (n: number) => "$" + n.toLocaleString("es-CL");

// Subida de documentos de una valorización Gold o Platinum, desde el enlace privado del certificado.
export function DocumentosCert({ token, plan, archivos, carpetaLista, avisos = {} }: {
  token: string; plan: PlanCert; archivos: Partial<Record<TipoDocCert, Archivo[]>>; carpetaLista: boolean;
  avisos?: Record<string, { estado: string; aviso: string | null }>; // lectura automática de cada archivo, por ruta
}) {
  const router = useRouter();
  const [subiendo, setSubiendo] = useState<TipoDocCert | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const autorizado = faltanObligatorias(CASILLAS_CERT_DOCS, marcadas) === 0;
  const docs = PLANES_CERT[plan].docs;
  const listo = (t: TipoDocCert) => (t === "carpeta" ? carpetaLista : (archivos[t]?.length ?? 0) > 0);
  const faltan = docs.filter((t) => !listo(t)).length;

  const api = (body: Record<string, unknown>) =>
    fetch("/api/certificado/documento", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...body }) })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "No se pudo completar."); return d; });

  async function subir(tipo: TipoDocCert, files: FileList | null) {
    if (!files?.length) return;
    setError(""); setSubiendo(tipo);
    try {
      for (const f of Array.from(files).slice(0, 4)) {
        const d = await api({ accion: "firmar", tipo, mime: f.type, tamano: f.size });
        const r = await fetch(d.url, { method: "PUT", headers: { "Content-Type": f.type, "x-upsert": "false", ...(d.apikey ? { apikey: d.apikey } : {}) }, body: f });
        if (!r.ok) throw new Error("La subida fue rechazada. Inténtalo de nuevo.");
        await api({ accion: "registrar", tipo, path: d.path, nombre: f.name });
      }
      router.refresh();
    } catch (e) { setError((e as Error).message); }
    setSubiendo(null);
  }

  async function quitar(tipo: TipoDocCert, path: string) {
    setError("");
    try { await api({ accion: "quitar", tipo, path }); router.refresh(); } catch (e) { setError((e as Error).message); }
  }

  async function enviar() {
    setError(""); setEnviando(true);
    const r = await fetch("/api/certificado/revision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, casillas: marcadas }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (r?.ok) router.refresh(); else setError(d.error || "No se pudo enviar.");
    setEnviando(false);
  }

  return (
    <div className="cd">
      <Casillas lista={CASILLAS_CERT_DOCS} marcadas={marcadas} cambiar={setMarcadas} />
      {!autorizado && <p className="fi-nota">Marca las dos autorizaciones para subir tus documentos.</p>}
      {autorizado && docs.map((t) => (
        <div key={t} className={`cd-doc${listo(t) ? " ok" : ""}`}>
          <h4>{listo(t) ? "✓" : "○"} {DOCS_CERT[t].t}</h4>
          <p>{DOCS_CERT[t].ayuda}</p>
          {t === "carpeta" ? (
            carpetaLista ? <p className="doc-ok">Carpeta tributaria recibida.</p> : (
              <CarpetaSII d={VALORIZACION_VACIA} compacto={false} cambiar={(x) => {
                if (x.carpetaToken) api({ accion: "carpeta", carpetaToken: x.carpetaToken }).then(() => router.refresh()).catch((e) => setError(e.message));
              }} />
            )
          ) : (
            <>
              {(archivos[t]?.length ?? 0) > 0 && (
                <ul className="cd-arch">
                  {archivos[t]!.map((a) => {
                    const v = avisos[a.path];
                    return (
                      <li key={a.path}>
                        <span>📄 {a.nombre}
                          {v && (v.estado === "pendiente" || v.estado === "leyendo") && <small className="cd-aviso">Leyendo el documento…</small>}
                          {v?.aviso && v.estado === "leido" && <small className="cd-aviso ok">✓ {v.aviso}</small>}
                          {v?.aviso && v.estado === "observado" && <small className="cd-aviso obs">⚠ {v.aviso} Quita este archivo y sube el correcto.</small>}
                        </span>
                        <button type="button" onClick={() => quitar(t, a.path)}>Quitar</button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <label className="btn ghost sm">
                {subiendo === t ? "Subiendo…" : (archivos[t]?.length ?? 0) > 0 ? "Agregar otro archivo" : "Subir archivo"}
                <input type="file" hidden accept="application/pdf,image/jpeg,image/png,image/webp" multiple disabled={subiendo !== null} onChange={(e) => { subir(t, e.target.files); e.target.value = ""; }} />
              </label>
            </>
          )}
        </div>
      ))}
      {error && <p className="pf-error" role="alert">{error}</p>}
      <button type="button" className="btn btn-grande" disabled={faltan > 0 || enviando || !autorizado} onClick={enviar}>
        {enviando ? "Enviando…" : faltan > 0 ? `Faltan ${faltan} ${faltan === 1 ? "documento" : "documentos"}` : "Enviar a revisión"}
      </button>
      <p className="fi-nota">PDF o imagen, hasta 10 MB por archivo. Los documentos se guardan en privado y solo los ve Nico Pacheco para verificar tu valorización.</p>
    </div>
  );
}

// Subir de plan pagando la diferencia.
export function MejorarPlan({ token, opciones }: { token: string; opciones: { plan: PlanCert; monto: number }[] }) {
  const [cargando, setCargando] = useState<PlanCert | null>(null);
  const [error, setError] = useState("");
  async function mejorar(plan: PlanCert) {
    setError(""); setCargando(plan);
    const r = await fetch("/api/certificado/mejorar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, plan }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (r?.ok && d.url) { window.location.href = d.url; return; }
    setError(d.error || "No se pudo iniciar."); setCargando(null);
  }
  return (
    <div className="cd-mejora">
      <strong>Sube el valor con documentos verificados</strong>
      <span className="fi-nota">Pagas solo la diferencia. Si los documentos coinciden con lo declarado, el valor sube y el certificado lleva sello holograma.</span>
      {opciones.map((o) => (
        <button key={o.plan} type="button" className="btn" disabled={cargando !== null} onClick={() => mejorar(o.plan)}>
          {cargando === o.plan ? "Preparando…" : `Pasar a ${PLANES_CERT[o.plan].nombre} (+${Math.round(PLANES_CERT[o.plan].prima * 100)}% al valor) · ${o.monto ? clp(o.monto) : "gratis"}`}
        </button>
      ))}
      {error && <p className="pf-error" role="alert">{error}</p>}
    </div>
  );
}
