import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { sitio } from "@/lib/pagos-valoriza";
import { correoActivo } from "@/lib/correo";
import { ORDEN_PLANES, PLANES_CERT } from "@/lib/certificado";
import { analisisDe, certificadoPorToken, diferenciaMejora, disponible, entregado, nivelVerificado, planDe, verificarPagoCertificado, vigencia } from "@/lib/certificados-servidor";
import { SelloPlan } from "../SelloPlan";
import { DocumentosCert, MejorarPlan } from "./DocumentosCert";
import { clp } from "@/lib/valorizacion";
import { Marco } from "../../valoriza/Marco";
import { Timbre } from "../Timbre";
import { BotonReintentar } from "./BotonReintentar";
import { avisosDocumentos, procesarPendientes } from "@/lib/lectura-servidor";
import { after } from "next/server";
import { iaActiva } from "@/lib/ia";
import { Refrescar } from "./Refrescar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Certificado de valorización · Nico Pacheco", robots: { index: false, follow: false } };

const fecha = (s: string) => new Date(s).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Santiago" });

export default async function PaginaCertificado({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string>> }) {
  const { token } = await params;
  const q = await searchParams;
  const c = await certificadoPorToken(token);
  if (!c) notFound();

  // Vuelta desde Mercado Pago: se confirma de inmediato (el aviso automático puede tardar unos segundos).
  const pagoId = q.payment_id || q.collection_id;
  if (c.estado === "pendiente" && pagoId && (q.status === "approved" || q.collection_status === "approved")) {
    // Se recarga la página: dentro de una misma carga, una segunda lectura devolvería el estado anterior.
    if (await verificarPagoCertificado(pagoId, sitio())) redirect(`/certificado/${token}`);
  }
  const listo = disponible(c);
  const a = listo ? analisisDe(c) : null;
  const plan = planDe(c);
  const nivel = nivelVerificado(c);
  const vence = vigencia(c);
  const superiores = ORDEN_PLANES.slice(ORDEN_PLANES.indexOf(plan) + 1).map((p) => ({ plan: p, monto: diferenciaMejora(c!, p) }));
  const archivos = Object.fromEntries(Object.entries(c.documentos ?? {}).map(([k, v]) => [k, (v?.archivos ?? []).map((x) => ({ path: x.path, nombre: x.nombre }))]));
  // Aviso de la lectura automática de cada archivo (migración 0027): «Leído…» o qué corregir.
  const avisos = plan !== "standard" && (c.revision === "pendiente_docs" || c.revision === "en_revision") ? await avisosDocumentos(c.id) : {};
  const leyendo = Object.values(avisos).some((x) => x.estado === "pendiente" || x.estado === "leyendo") || (c.revision === "en_revision" && iaActiva() && c.lectura?.estado !== "listo");
  // Respaldo del cron (el plan Hobby de Vercel solo permite un cron diario): si la lectura quedó sin terminar, se reintenta al abrir la página.
  if (c.revision === "en_revision" && iaActiva()) after(() => procesarPendientes(sitio(), 1).catch(() => null));
  const rechazado = q.status === "rejected" || q.status === "failure" || q.collection_status === "rejected";
  const enProceso = q.status === "pending" || q.status === "in_process";

  return (
    <Marco>
      <main className="wrap pg">
        {leyendo && <Refrescar segundos={6} />}
        <span className="eyebrow">Certificado de valorización N° {c.folio}</span>
        <h1>{c.negocio}</h1>

        {listo && a && (
          <div className="cd-estado">
            <SelloPlan plan={nivel ?? plan} tam={72} verificado={Boolean(nivel) || plan === "standard"} />
            <div>
              <strong>Valorización {PLANES_CERT[plan].nombre}</strong>
              <p className="fi-nota" style={{ margin: "2px 0 0" }}>
                {plan === "standard" && "Basada en la información que declaraste."}
                {plan !== "standard" && c.revision === "pendiente_docs" && "Falta que subas tus documentos. Mientras tanto puedes descargar la versión Standard."}
                {c.revision === "en_revision" && (iaActiva() ? "Recibimos tus documentos y los estamos leyendo. Normalmente el resultado llega en minutos; te avisamos por correo (como máximo en 48 horas hábiles)." : "Recibimos tus documentos: los revisamos en 48 horas hábiles y te avisamos por correo.")}
                {nivel && `Documentos verificados el ${fecha(c.revisado_en!)}. El valor incluye ${Math.round(PLANES_CERT[nivel].prima * 100)}% de prima por información verificada.`}
                {c.revision === "rechazado" && "No pudimos verificar los documentos: el certificado se emitió como Standard."}
                {vence && ` Vigente hasta el ${fecha(vence.toISOString())}.`}
              </p>
            </div>
          </div>
        )}
        {listo && plan !== "standard" && c.revision === "pendiente_docs" && (
          <div className="pg-caja">
            <h2>Sube tus documentos</h2>
            {c.revision_nota && <p className="pg-alerta">{c.revision_nota}</p>}
            <DocumentosCert token={c.token} plan={plan} archivos={archivos} carpetaLista={entregado(c, "carpeta")} avisos={avisos} />
          </div>
        )}
        {listo && a ? (
          <div className="pg-caja cv-caja">
            <div className="cv-cab">
              <div className="pg-monto">
                <span>Valor de referencia del derecho de llave</span>
                <strong>{clp(a.valor)}</strong>
                <small>Rango según métodos de contraste: {clp(a.rango[0])} a {clp(a.rango[1])}</small>
                {a.r.utilidadNormalizada > 0 && (
                  <small>Recuperación de la inversión: {a.r.mesesRecupero.toFixed(1).replace(".", ",")} meses de utilidad{c.datos?.m2 ? `, ${c.datos.m2} m²` : ""}</small>
                )}
              </div>
              <Timbre folio={c.folio} fecha={fecha(c.pagado_en ?? c.creado_en)} />
            </div>
            <ul className="cv-metodos">
              {a.metodos.map((m) => (
                <li key={m.id}><span>{m.nombre}</span><strong>{clp(m.valor)}</strong></li>
              ))}
            </ul>
            <a className="btn btn-grande" href={`/api/certificado/pdf?t=${c.token}`} download>{plan !== "standard" && !nivel ? "Descargar versión Standard (PDF)" : `Descargar certificado ${PLANES_CERT[nivel ?? "standard"].nombre} (PDF)`}</a>
            <a className="btn ghost" href={`/valoriza?certificado=${c.token}`}>Ver el detalle en el valorizador</a>
            {iaActiva() && superiores.length > 0 && c.revision !== "en_revision" && <MejorarPlan token={c.token} opciones={superiores} />}
            <p className="fi-nota">
              Guarda este enlace: es privado y te permite descargar el certificado cuando quieras. {correoActivo() ? `También te lo enviamos a ${c.correo}. ` : ""}
              {nivel ? "Es un valor de referencia contrastado con tus documentos" : "Es un valor de referencia basado en la información que declaraste"}; no es una tasación pericial.
            </p>
          </div>
        ) : (
          <div className="pg-caja">
            <h2>Falta confirmar el pago</h2>
            {rechazado && <p className="pg-alerta">Mercado Pago no aprobó el pago. Puedes intentarlo de nuevo.</p>}
            {enProceso && <p>Tu pago está en proceso. Apenas Mercado Pago lo confirme te enviaremos el certificado por correo; puedes recargar esta página en unos minutos.</p>}
            {!rechazado && !enProceso && <p>Cuando Mercado Pago confirme el pago podrás descargar tu certificado desde esta página.</p>}
            <BotonReintentar token={c.token} monto={c.monto} />
            <p className="fi-nota">Pago seguro en Mercado Pago. Nico Pacheco no ve ni guarda los datos de tu tarjeta.</p>
          </div>
        )}
      </main>
    </Marco>
  );
}
