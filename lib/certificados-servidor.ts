import "server-only";
import { BUCKET, cliente } from "./base-servidor";
import { enviarCorreo, escapar } from "./correo";
import { consultarPago, pagosActivos, plantilla, preferenciaMP } from "./pagos-valoriza";
import { evaluarCodigo, sumarUsoCodigo } from "./servidor";
import { analizar, DOCS_CERT, ORDEN_PLANES, PLANES_CERT, PRECIO_CERTIFICADO, precioCertificado, type PlanCert, type TipoDocCert } from "./certificado";
import { carpetaPorToken, datosDeCarpeta } from "./carpeta-servidor";
import { aplicarDetalle } from "./inventario";
import { clp, VALORIZACION_VACIA, type DatosValorizacion, type NivelVerificado } from "./valorizacion";

// Certificados de valorización: se cobran con Mercado Pago cuando MP_ACCESS_TOKEN existe.
// Mientras no exista (lanzamiento), el certificado se entrega gratis.

export type Revision = "no_aplica" | "pendiente_docs" | "en_revision" | "verificado" | "rechazado";
export type ArchivoCert = { path: string; nombre: string; subido: string };
export type DocumentosCert = Partial<Record<TipoDocCert, { archivos?: ArchivoCert[]; carpetaToken?: string }>>;
export type VerificacionCert = {
  items?: Partial<Record<TipoDocCert, { ok: boolean; nota?: string }>>;
  // Cifras oficiales que reemplazan a las declaradas (revisión manual o lectura automática, 16 oct 2026).
  correcciones?: Partial<Record<keyof DatosValorizacion, string>>;
};
export type Certificado = {
  id: string; folio: number; token: string; creado_en: string; nombre: string; correo: string; negocio: string;
  datos: DatosValorizacion; valor: number; precio_lista: number; monto: number; estado: string; pagado_en: string | null;
  // Migración 0025 (planes): si falta, se asume Standard.
  plan?: PlanCert; documentos?: DocumentosCert; revision?: Revision; revision_nota?: string | null; revisado_en?: string | null;
  verificacion?: VerificacionCert;
  lectura?: LecturaCert; // migración 0027
};
// Resumen de la lectura automática con IA (lib/lectura-servidor.ts).
export type LecturaCert = {
  estado?: "procesando" | "listo" | "error";
  iniciado?: string; terminado?: string;
  decision?: "verificar" | "pedir_correccion" | "revision_humana";
  aplicada?: boolean;          // la decisión se aplicó sola (modo automático)
  motivos?: string[];
  valorDeclarado?: number; valorVerificado?: number;
  costoUSD?: number; tokens?: number;
  auditoria?: boolean;         // muestra al azar de los verificados para revisar después
  error?: string;
};
// Los códigos de descuento del panel se evalúan contra este servicio.
const PRODUCTO_CODIGOS = { id: "valorizacion-pyme", tipo: "servicio", padre: null };
const COLUMNAS_BASE = "id, folio, token, creado_en, nombre, correo, negocio, datos, valor, precio_lista, monto, estado, pagado_en";
const COLUMNAS_0025 = `${COLUMNAS_BASE}, plan, documentos, revision, revision_nota, revisado_en, verificacion`;
const COLUMNAS = `${COLUMNAS_0025}, lectura`;
export const CORREO_CERTIFICADOS = () => process.env.CERTIFICADO_AVISO_CORREO?.trim() || "nikolaspacheco@gmail.com";

// ---------- Reglas del plan (puras, sobre un certificado ya leído) ----------
export const planDe = (c: Certificado): PlanCert => c.plan ?? "standard";
// Gold y Platinum suben el valor solo cuando la revisión los verificó.
export const nivelVerificado = (c: Certificado): NivelVerificado | null => {
  const p = planDe(c);
  return p !== "standard" && c.revision === "verificado" ? p : null;
};
// Cifras corregidas por la revisión (si los documentos mostraron otras), sobre lo declarado.
export function datosEfectivos(c: Certificado): DatosValorizacion {
  const k = c.verificacion?.correcciones ?? {};
  const limpias = Object.fromEntries(Object.entries(k).filter(([key, v]) => key in VALORIZACION_VACIA && typeof v === "string" && v !== ""));
  return { ...VALORIZACION_VACIA, ...c.datos, ...limpias, ...(k.ventaNeta ? { ventaMensual: "" } : {}) } as DatosValorizacion;
}
export const analisisDe = (c: Certificado) => analizar(datosEfectivos(c), { verificado: nivelVerificado(c) });
export const esVendedorCert = (c: Certificado) => c.precio_lista > 0 && c.precio_lista < PLANES_CERT[planDe(c)].lista;
// Documentos entregados: la carpeta cuenta si ya venía del valorizador.
export function entregado(c: Certificado, tipo: TipoDocCert) {
  if (tipo === "carpeta") return Boolean(c.documentos?.carpeta?.carpetaToken || c.datos.carpetaToken);
  return (c.documentos?.[tipo]?.archivos?.length ?? 0) > 0;
}
export const faltantes = (c: Certificado) => PLANES_CERT[planDe(c)].docs.filter((t) => !entregado(c, t));
// Vigencia: Standard 3 meses desde la emisión; Gold y Platinum 6 meses desde la verificación.
export function vigencia(c: Certificado): Date | null {
  const n = nivelVerificado(c);
  const desde = n ? c.revisado_en : c.pagado_en ?? c.creado_en;
  if (!desde) return null;
  const f = new Date(desde);
  f.setMonth(f.getMonth() + PLANES_CERT[n ?? "standard"].mesesVigencia);
  return f;
}

async function leerUno(filtro: (q: ReturnType<ReturnType<NonNullable<ReturnType<typeof cliente>>["from"]>["select"]>) => unknown) {
  const sb = cliente();
  if (!sb) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: any = await (filtro(sb.from("certificados_valorizacion").select(COLUMNAS)) as any).maybeSingle();
  if (r.error) console.error("No se pudo leer el certificado", r.error.message);
  return (r.data as Certificado) ?? null;
}

export const cobroCertificado = () => pagosActivos();
export const disponible = (c: Pick<Certificado, "estado">) => c.estado === "pagado" || c.estado === "gratis";

// Solo se aceptan las claves conocidas del valorizador, como texto corto.
export function limpiarDatos(b: unknown): DatosValorizacion {
  const d = { ...VALORIZACION_VACIA } as unknown as Record<string, string>;
  if (b && typeof b === "object") {
    for (const k of Object.keys(VALORIZACION_VACIA)) {
      const v = (b as Record<string, unknown>)[k];
      if (typeof v === "string") d[k] = v.slice(0, 80);
    }
  }
  // Inventario detallado (29 oct): lista aparte, validada; con detalle, los precios nuevos totales salen de él.
  const det = b && typeof b === "object" ? (b as Record<string, unknown>).inventarioDetalle : undefined;
  return aplicarDetalle({ ...(d as unknown as DatosValorizacion), inventarioDetalle: det as DatosValorizacion["inventarioDetalle"] });
}

export async function certificadoPorToken(token: string): Promise<Certificado | null> {
  if (!/^[0-9a-f-]{36}$/.test(token)) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return leerUno((q: any) => q.eq("token", token));
}
export async function certificadoPorId(id: string): Promise<Certificado | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return leerUno((q: any) => q.eq("id", id));
}

type Solicitud = { nombre: string; correo: string; negocio: string; datos: DatosValorizacion; plan?: PlanCert };

export async function crearCertificado(s: Solicitud, base: string, codigo?: string) {
  const sb = cliente();
  if (!sb) return { error: "No disponible por ahora. Inténtalo más tarde." } as const;
  const a = analizar(s.datos);
  if (!a.r.listo) return { error: "Faltan la venta, la utilidad o los meses de contrato." } as const;
  const cobro = cobroCertificado();
  const plan: PlanCert = s.plan ?? "standard";
  const precio = precioCertificado(false, plan);
  let monto = cobro ? precio : 0;
  let codigoAplicado: string | null = null;
  if (cobro && codigo) {
    const e = await evaluarCodigo(codigo, PRODUCTO_CODIGOS, monto);
    if (!e.valido) return { error: e.mensaje } as const;
    monto = e.total ?? monto;
    codigoAplicado = e.codigo ?? null;
  }
  // Código de 100%: queda pagado sin pasar por Mercado Pago.
  const gratisPorCodigo = cobro && monto === 0;
  const fila = {
    nombre: s.nombre, correo: s.correo, negocio: s.negocio, datos: s.datos, valor: Math.round(a.valor),
    precio_lista: precio, monto, acepta_datos: true,
    estado: !cobro ? "gratis" : gratisPorCodigo ? "pagado" : "pendiente",
    ...(gratisPorCodigo ? { pagado_en: new Date().toISOString(), mp_pago: "codigo-100" } : {}),
    ...(codigoAplicado ? { codigo: codigoAplicado } : {}),
  };
  const { data, error } = await sb.from("certificados_valorizacion")
    .insert({ ...fila, plan, revision: plan === "standard" ? "no_aplica" : "pendiente_docs" })
    .select(COLUMNAS).single();
  if (error || !data) {
    console.error("No se pudo crear el certificado", error?.message);
    return { error: "No pudimos preparar tu certificado. Inténtalo de nuevo." } as const;
  }
  const c = data as unknown as Certificado;
  if (!cobro || gratisPorCodigo) {
    if (gratisPorCodigo && codigoAplicado) await sumarUsoCodigo(codigoAplicado);
    await enviarCertificado(c, base);
    return { url: `${base}/certificado/${c.token}` } as const;
  }
  return pagarCertificado(c, base);
}

// Crea el cobro en Mercado Pago (también sirve para reintentar si el primer pago fue rechazado).
export async function pagarCertificado(c: Certificado, base: string) {
  const sb = cliente();
  if (!sb) return { error: "No disponible por ahora." } as const;
  if (!pagosActivos()) return { error: "El pago con Mercado Pago se activa muy pronto." } as const;
  const pagina = `${base}/certificado/${c.token}`;
  const pref = await preferenciaMP({
    id: "certificado-valorizacion",
    titulo: `Valorización ${PLANES_CERT[planDe(c)].nombre} N° ${c.folio}: ${c.negocio}`,
    precio: c.monto || PRECIO_CERTIFICADO,
    correo: c.correo,
    nombre: c.nombre,
    referencia: c.id,
    volver: pagina,
    aviso: `${base}/api/certificado/webhook`,
  });
  if (!pref) return { error: "Mercado Pago no respondió. Inténtalo en unos minutos." } as const;
  await sb.from("certificados_valorizacion").update({ mp_preferencia: pref.id }).eq("id", c.id);
  return { url: pref.init_point } as const;
}

// Valida el pago consultándolo a Mercado Pago (nunca se confía en lo que llega del navegador o del aviso).
export async function verificarPagoCertificado(mpPagoId: string, base: string) {
  if (!pagosActivos() || !/^\d+$/.test(mpPagoId)) return false;
  const pago = await consultarPago(mpPagoId);
  if (!pago || pago.status !== "approved" || pago.currency_id !== "CLP") return false;
  if (String(pago.external_reference).startsWith("mejora:")) return confirmarMejora(pago, base);
  if (!/^[0-9a-f-]{36}$/.test(pago.external_reference)) return false;
  const sb = cliente();
  if (!sb) return false;
  const { data: c } = await sb.from("certificados_valorizacion").select("id, monto").eq("id", pago.external_reference).maybeSingle();
  if (!c || pago.transaction_amount < c.monto) return false;
  const { data } = await sb
    .from("certificados_valorizacion")
    .update({ estado: "pagado", mp_pago: String(pago.id), pagado_en: new Date().toISOString() })
    .eq("id", c.id)
    .eq("estado", "pendiente")
    .select("id")
    .maybeSingle();
  if (!data) return false; // ya estaba confirmado
  const cert = await certificadoPorId(c.id);
  if (!cert) return false;
  const { data: k } = await sb.from("certificados_valorizacion").select("codigo").eq("id", cert.id).maybeSingle();
  if (k?.codigo) await sumarUsoCodigo(k.codigo as string);
  await enviarCertificado(cert, base);
  return true;
}

async function enviarCertificado(c: Certificado, base: string) {
  if (planDe(c) !== "standard") return pedirDocumentos(c, base);
  const ok = await enviarCorreo(
    c.correo,
    `Tu certificado de valorización N° ${c.folio}: ${c.negocio}`,
    plantilla(
      "Tu certificado de valorización está listo",
      `<p style="font-size:15px">Hola ${escapar(c.nombre.split(" ")[0] || "")}:</p>
<p style="font-size:15px">El valor de referencia de <b>«${escapar(c.negocio)}»</b> es <b>${clp(c.valor)}</b>. Descarga el certificado N° ${c.folio} en PDF desde este enlace privado:</p>
<p style="font-size:14px;color:#5a6678">Es un valor de referencia basado en la información que declaraste; no es una tasación pericial.</p>`,
      { texto: "Descargar mi certificado", href: `${base}/certificado/${c.token}` },
    ),
  );
  if (ok) await cliente()?.from("certificados_valorizacion").update({ enviado: true }).eq("id", c.id);
}

// ---------- Gold y Platinum: documentos, revisión y mejora de plan ----------

const lista = (tipos: TipoDocCert[]) => `<ul style="font-size:14px;padding-left:18px">${tipos.map((t) => `<li style="margin:4px 0"><b>${escapar(DOCS_CERT[t].t)}</b><br><span style="color:#5a6678">${escapar(DOCS_CERT[t].ayuda)}</span></li>`).join("")}</ul>`;

async function pedirDocumentos(c: Certificado, base: string) {
  const p = PLANES_CERT[planDe(c)];
  const ok = await enviarCorreo(
    c.correo,
    `Sube tus documentos: valorización ${p.nombre} N° ${c.folio}`,
    plantilla(
      `Tu valorización ${p.nombre} está pagada`,
      `<p style="font-size:15px">Hola ${escapar(c.nombre.split(" ")[0] || "")}:</p>
<p style="font-size:15px">Para emitir tu certificado <b>${p.nombre}</b> de «${escapar(c.negocio)}» necesitamos estos documentos. Si coinciden con lo que declaraste, el valor sube ${Math.round(p.prima * 100)}% por información verificada:</p>
${lista(faltantes(c))}
<p style="font-size:14px;color:#5a6678">Súbelos desde tu enlace privado. Los revisamos en 48 horas hábiles. Mientras tanto puedes descargar la versión Standard.</p>`,
      { texto: "Subir mis documentos", href: `${base}/certificado/${c.token}` },
    ),
  );
  if (ok) await cliente()?.from("certificados_valorizacion").update({ enviado: true }).eq("id", c.id);
}

// Firma una subida directa a Storage (bucket privado «avisos», carpeta certificados/<id>/).
const EXT: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" };
export const MAX_MB_DOC_CERT = 10;
export async function firmarSubidaDoc(c: Certificado, tipo: TipoDocCert, mime: string, tamano: number) {
  if (!PLANES_CERT[planDe(c)].docs.includes(tipo) || tipo === "carpeta") return { error: "Este documento no corresponde a tu plan." } as const;
  if (c.revision !== "pendiente_docs") return { error: "Tus documentos ya están en revisión." } as const;
  if (!EXT[mime]) return { error: "Sube un PDF o una imagen (JPG o PNG)." } as const;
  if (!(tamano > 0) || tamano > MAX_MB_DOC_CERT * 1024 * 1024) return { error: `El archivo supera ${MAX_MB_DOC_CERT} MB.` } as const;
  if ((c.documentos?.[tipo]?.archivos?.length ?? 0) >= 4) return { error: "Máximo 4 archivos por documento." } as const;
  const sb = cliente();
  if (!sb) return { error: "La subida de archivos no está activa." } as const;
  const path = `certificados/${c.id}/${tipo}-${crypto.randomUUID()}.${EXT[mime]}`;
  const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: "No pudimos preparar la subida. Inténtalo de nuevo." } as const;
  return { path, url: data.signedUrl, apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" } as const;
}

async function guardarDocumentos(c: Certificado, documentos: DocumentosCert, extra: Record<string, unknown> = {}) {
  const sb = cliente();
  if (!sb) return false;
  const { error } = await sb.from("certificados_valorizacion").update({ documentos, ...extra }).eq("id", c.id);
  return !error;
}

export async function registrarDocumento(c: Certificado, tipo: TipoDocCert, path: string, nombre: string) {
  if (c.revision !== "pendiente_docs" || !path.startsWith(`certificados/${c.id}/${tipo}-`) || path.includes("..")) return { error: "Archivo no válido." } as const;
  const docs: DocumentosCert = structuredClone(c.documentos ?? {});
  const archivos = docs[tipo]?.archivos ?? [];
  if (!archivos.some((a) => a.path === path)) archivos.push({ path, nombre: nombre.slice(0, 120) || "documento", subido: new Date().toISOString() });
  docs[tipo] = { ...docs[tipo], archivos: archivos.slice(0, 4) };
  return (await guardarDocumentos(c, docs)) ? ({ ok: true, documentos: docs } as const) : ({ error: "No se pudo guardar." } as const);
}

export async function quitarDocumento(c: Certificado, tipo: TipoDocCert, path: string) {
  if (c.revision !== "pendiente_docs") return { error: "Tus documentos ya están en revisión." } as const;
  const docs: DocumentosCert = structuredClone(c.documentos ?? {});
  docs[tipo] = { ...docs[tipo], archivos: (docs[tipo]?.archivos ?? []).filter((a) => a.path !== path) };
  await cliente()?.storage.from(BUCKET).remove([path]).catch(() => null);
  return (await guardarDocumentos(c, docs)) ? ({ ok: true, documentos: docs } as const) : ({ error: "No se pudo guardar." } as const);
}

// Carpeta tributaria subida desde la página del certificado: se relee en el servidor y actualiza las cifras.
export async function agregarCarpeta(c: Certificado, carpetaToken: string) {
  if (c.revision !== "pendiente_docs") return { error: "Tus documentos ya están en revisión." } as const;
  const k = await carpetaPorToken(carpetaToken);
  if (!k) return { error: "No encontramos la carpeta. Súbela de nuevo." } as const;
  const docs: DocumentosCert = { ...(c.documentos ?? {}), carpeta: { carpetaToken } };
  const datos = { ...c.datos, ...datosDeCarpeta(k) };
  return (await guardarDocumentos(c, docs, { datos })) ? ({ ok: true } as const) : ({ error: "No se pudo guardar." } as const);
}

export async function enviarARevision(c: Certificado, base: string) {
  if (c.revision !== "pendiente_docs") return { error: "Tus documentos ya están en revisión." } as const;
  const f = faltantes(c);
  if (f.length) return { error: `Falta: ${f.map((t) => DOCS_CERT[t].t).join("; ")}.` } as const;
  const sb = cliente();
  if (!sb) return { error: "No disponible por ahora." } as const;
  await sb.from("certificados_valorizacion").update({ revision: "en_revision", revision_nota: null }).eq("id", c.id);
  // Nueva ronda de lectura automática.
  const { error: sinLectura } = await sb.from("certificados_valorizacion").update({ lectura: {} }).eq("id", c.id);
  const p = PLANES_CERT[planDe(c)];
  // Con lectura automática, el dueño recibe correo solo si la IA no puede decidir (lib/lectura-servidor.ts).
  if (process.env.ANTHROPIC_API_KEY?.trim() && !sinLectura) return { ok: true } as const;
  await enviarCorreo(
    CORREO_CERTIFICADOS(),
    `Revisar valorización ${p.nombre} N° ${c.folio}: ${c.negocio}`,
    plantilla(`Valorización ${p.nombre} lista para revisar`,
      `<p style="font-size:15px"><b>${escapar(c.nombre)}</b> (${escapar(c.correo)}) subió los documentos de «${escapar(c.negocio)}». Compromiso: revisarlos en 48 horas hábiles.</p>`,
      { texto: "Revisar en el panel", href: `${base}/admin` }),
  );
  return { ok: true } as const;
}

// Resultado de la revisión (lo decide el dueño en /admin/certificado/[id]).
export async function resolverRevision(id: string, accion: "verificar" | "corregir" | "standard", o: { nota: string; verificacion: VerificacionCert }, base: string) {
  const c = await certificadoPorId(id);
  const sb = cliente();
  if (!c || !sb || planDe(c) === "standard") return { error: "Certificado no encontrado." } as const;
  const revision: Revision = accion === "verificar" ? "verificado" : accion === "corregir" ? "pendiente_docs" : "rechazado";
  const cambios = { revision, revision_nota: o.nota.slice(0, 1500) || null, verificacion: o.verificacion, revisado_en: new Date().toISOString() };
  const nuevo = { ...c, ...cambios };
  const valor = Math.round(analisisDe(nuevo).valor);
  const { error } = await sb.from("certificados_valorizacion").update({ ...cambios, valor }).eq("id", id);
  if (error) return { error: error.message } as const;
  const p = PLANES_CERT[planDe(c)];
  const primer = escapar(c.nombre.split(" ")[0] || "");
  const nota = o.nota ? `<p style="font-size:14px;background:#f4f6f9;padding:10px 12px;border-radius:8px">${escapar(o.nota)}</p>` : "";
  const [asunto, titulo, cuerpo, boton] =
    accion === "verificar"
      ? [`Tu valorización ${p.nombre} está verificada (N° ${c.folio})`, `Valorización ${p.nombre} verificada`,
        `<p style="font-size:15px">Hola ${primer}: revisamos tus documentos y coinciden. El valor de referencia de «${escapar(c.negocio)}» es <b>${clp(valor)}</b>, con ${Math.round(p.prima * 100)}% de prima por información verificada.</p>${nota}`, "Descargar mi certificado"]
      : accion === "corregir"
        ? [`Falta corregir documentos de tu valorización ${p.nombre}`, "Necesitamos un ajuste en tus documentos",
          `<p style="font-size:15px">Hola ${primer}: revisamos tus documentos de «${escapar(c.negocio)}» y necesitamos que corrijas o agregues algo:</p>${nota}`, "Corregir mis documentos"]
        : [`Tu valorización N° ${c.folio} se emitió como Standard`, "Tu certificado se emitió como Standard",
          `<p style="font-size:15px">Hola ${primer}: no pudimos verificar los documentos de «${escapar(c.negocio)}», así que el certificado se emite como Standard, sin prima por información verificada.</p>${nota}`, "Ver mi certificado"];
  await enviarCorreo(c.correo, asunto, plantilla(titulo, cuerpo, { texto: boton, href: `${base}/certificado/${c.token}` }));
  return { ok: true } as const;
}

// Mejora de plan (Standard → Gold → Platinum) pagando solo la diferencia.
export const descuentoCert = (c: Certificado) =>
  c.precio_lista > 0 ? Math.max(0, Math.round((1 - c.precio_lista / PLANES_CERT[planDe(c)].lista) * 100) / 100) : 0;
export function diferenciaMejora(c: Certificado, plan: PlanCert) {
  const d = descuentoCert(c);
  return Math.max(0, precioCertificado(d, plan) - precioCertificado(d, planDe(c)));
}

export async function mejorarCertificado(c: Certificado, plan: PlanCert, base: string) {
  if (!disponible(c)) return { error: "Primero completa el pago de tu certificado." } as const;
  if (ORDEN_PLANES.indexOf(plan) <= ORDEN_PLANES.indexOf(planDe(c))) return { error: "Elige un plan superior." } as const;
  if (c.revision === "en_revision") return { error: "Espera el resultado de la revisión en curso." } as const;
  const sb = cliente();
  if (!sb) return { error: "No disponible por ahora." } as const;
  const monto = diferenciaMejora(c, plan);
  const pagina = `${base}/certificado/${c.token}`;
  if (!pagosActivos() || monto === 0) {
    const r = await aplicarMejora(c, plan, 0, "gratis");
    if (!r) return { error: "Las valorizaciones Gold y Platinum se activan muy pronto." } as const;
    await pedirDocumentos({ ...c, plan, revision: "pendiente_docs" }, base);
    return { url: pagina } as const;
  }
  const pref = await preferenciaMP({
    id: "certificado-mejora", titulo: `Mejora a valorización ${PLANES_CERT[plan].nombre} N° ${c.folio}: ${c.negocio}`,
    precio: monto, correo: c.correo, nombre: c.nombre, referencia: `mejora:${c.id}:${plan}`,
    volver: pagina, aviso: `${base}/api/certificado/webhook`,
  });
  if (!pref) return { error: "Mercado Pago no respondió. Inténtalo en unos minutos." } as const;
  return { url: pref.init_point } as const;
}

async function aplicarMejora(c: Certificado, plan: PlanCert, pagado: number, ref: string) {
  const sb = cliente();
  if (!sb) return false;
  const { data, error } = await sb.from("certificados_valorizacion")
    .update({ plan, revision: "pendiente_docs", revision_nota: null, precio_lista: precioCertificado(descuentoCert(c), plan), monto: c.monto + pagado, mejora_pago: ref })
    .eq("id", c.id).neq("plan", plan).select("id").maybeSingle();
  return !error && Boolean(data);
}

async function confirmarMejora(pago: { id: number | string; external_reference: string; transaction_amount: number }, base: string) {
  const [, id, plan] = String(pago.external_reference).split(":");
  if (!/^[0-9a-f-]{36}$/.test(id ?? "") || (plan !== "gold" && plan !== "platinum")) return false;
  const c = await certificadoPorId(id);
  if (!c || pago.transaction_amount < diferenciaMejora(c, plan)) return false;
  if (!(await aplicarMejora(c, plan, pago.transaction_amount, String(pago.id)))) return false; // ya aplicada
  await pedirDocumentos({ ...c, plan, revision: "pendiente_docs" }, base);
  return true;
}

// URL firmada (1 hora) para que el dueño vea un documento en el panel.
export async function urlDocumento(path: string) {
  const { data } = (await cliente()?.storage.from(BUCKET).createSignedUrl(path, 3600)) ?? { data: null };
  return data?.signedUrl ?? null;
}

