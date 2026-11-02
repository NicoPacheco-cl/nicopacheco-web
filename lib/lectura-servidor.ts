import "server-only";
import { BUCKET, cliente } from "./base-servidor";
import { enviarCorreo, escapar } from "./correo";
import { plantilla } from "./pagos-valoriza";
import { DOCS_CERT, PLANES_CERT, type TipoDocCert } from "./certificado";
import { carpetaPorToken, datosDeCarpeta } from "./carpeta-servidor";
import { analisisDe, certificadoPorId, CORREO_CERTIFICADOS, planDe, resolverRevision, type Certificado, type LecturaCert } from "./certificados-servidor";
import { avisoVendedor, contrastar, type Autenticidad, type DocLeido, type ResultadoContraste } from "./contraste";
import { costoUSD, iaActiva, leerConIA, mimeLegible } from "./ia";
import { esquemaDe, type Extraccion } from "./lectura-esquemas";
import { revisarArchivo, verificarEnLinea } from "./autenticidad";
import { clp } from "./valorizacion";

// Lectura automática de los documentos Gold y Platinum (16 oct 2026).
// Flujo: el vendedor sube cada archivo → se lee al tiro y ve un aviso («Leído: certificado F30 emitido el…» o
// «Parece un F29 suelto…») → «Enviar a revisión» → se leen los que falten, se contrastan con lo declarado
// (lib/contraste.ts) y se decide solo:
//   verificar → certificado verificado con las cifras oficiales (correo al cliente);
//   pedir_correccion → correo al cliente con lo que debe corregir;
//   revision_humana → correo al dueño: solo estos casos necesitan su revisión.
// CERT_AUTOMATICO=0 desactiva las decisiones automáticas (todo queda como sugerencia para el dueño).
// Si falta ANTHROPIC_API_KEY o la migración 0027, todo sigue como antes (revisión manual).

export const modoAutomatico = () => process.env.CERT_AUTOMATICO !== "0";
const PROB_AUDITORIA = 0.1; // 1 de cada 10 verificados queda marcado para revisarlo después (no frena al cliente)

type FilaDoc = { id: string; certificado_id: string; tipo: TipoDocCert; path: string; nombre: string | null; estado: string; aviso: string | null; intentos: number };
const MIME: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic" };
const mimeDe = (path: string) => MIME[path.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";

// Archivos que corresponden hoy al certificado (incluida la carpeta, que se guarda aparte).
async function archivosActuales(c: Certificado) {
  const lista: { tipo: TipoDocCert; path: string; nombre: string }[] = [];
  for (const t of PLANES_CERT[planDe(c)].docs) {
    if (t === "carpeta") {
      const tok = c.documentos?.carpeta?.carpetaToken || c.datos.carpetaToken;
      const k = tok ? await carpetaPorToken(tok) : null;
      if (k?.archivo) lista.push({ tipo: t, path: k.archivo, nombre: k.nombre_archivo || "Carpeta tributaria" });
    } else for (const a of c.documentos?.[t]?.archivos ?? []) lista.push({ tipo: t, path: a.path, nombre: a.nombre });
  }
  return lista;
}

// Deja la tabla cert_documentos igual a los archivos actuales. Devuelve null si falta la migración 0027.
async function sincronizar(c: Certificado): Promise<FilaDoc[] | null> {
  const sb = cliente();
  if (!sb) return null;
  const actuales = await archivosActuales(c);
  const { data, error } = await sb.from("cert_documentos").select("id, certificado_id, tipo, path, nombre, estado, aviso, intentos").eq("certificado_id", c.id);
  if (error) { console.error("Lectura IA: falta la migración 0027?", error.message); return null; }
  const filas = (data ?? []) as FilaDoc[];
  const sobran = filas.filter((f) => !actuales.some((a) => a.path === f.path));
  if (sobran.length) await sb.from("cert_documentos").delete().in("id", sobran.map((f) => f.id));
  const nuevos = actuales.filter((a) => !filas.some((f) => f.path === a.path));
  if (nuevos.length) {
    const { data: ins } = await sb.from("cert_documentos").insert(nuevos.map((a) => ({ certificado_id: c.id, tipo: a.tipo, path: a.path, nombre: a.nombre.slice(0, 160) })))
      .select("id, certificado_id, tipo, path, nombre, estado, aviso, intentos");
    filas.push(...((ins ?? []) as FilaDoc[]));
  }
  return filas.filter((f) => actuales.some((a) => a.path === f.path));
}

type Leido = DocLeido & { tokens: number; costo: number };

// Lee un archivo con la IA y guarda la extracción. Si ya estaba leído, usa la última extracción guardada.
async function leerFila(f: FilaDoc, forzar = false, rubro?: string): Promise<Leido> {
  const sb = cliente()!;
  const nombre = f.nombre || DOCS_CERT[f.tipo].t;
  if (!forzar && (f.estado === "leido" || f.estado === "observado")) {
    const { data: ex } = await sb.from("cert_extracciones").select("campos, autenticidad").eq("documento_id", f.id).order("creado_en", { ascending: false }).limit(1).maybeSingle();
    if (ex) return { tipo: f.tipo, nombre, extraccion: ex.campos as Extraccion, autenticidad: ex.autenticidad as Autenticidad, tokens: 0, costo: 0 };
  }
  const mime = mimeDe(f.path);
  const vacia: Autenticidad = { formato: mime === "application/pdf" ? "pdf" : mime.startsWith("image/") ? "imagen" : "otro", senalesArchivo: [], enLinea: "no_aplica" };
  if (!mimeLegible(mime)) {
    await sb.from("cert_documentos").update({ estado: "observado", aviso: "Este formato no se puede leer. Sube un PDF o una foto JPG o PNG.", leido_en: new Date().toISOString() }).eq("id", f.id);
    return { tipo: f.tipo, nombre, extraccion: { tipo_documento: "otro", legible: false, confianza: 0 }, autenticidad: vacia, tokens: 0, costo: 0 };
  }
  await sb.from("cert_documentos").update({ estado: "leyendo", intentos: f.intentos + 1 }).eq("id", f.id);
  const { data: blob, error } = await sb.storage.from(BUCKET).download(f.path);
  if (error || !blob) {
    await sb.from("cert_documentos").update({ estado: "error", aviso: null }).eq("id", f.id);
    return { tipo: f.tipo, nombre, extraccion: null, autenticidad: vacia, error: "no se encontró el archivo", tokens: 0, costo: 0 };
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const { instruccion, esquema } = esquemaDe(f.tipo, { rubro: rubro ?? undefined });
  const r = await leerConIA<Extraccion>([{ mime, base64: Buffer.from(bytes).toString("base64") }], instruccion, esquema, f.tipo === "carpeta" ? 8000 : 4000);
  if (!r.ok) {
    await sb.from("cert_documentos").update({ estado: "error" }).eq("id", f.id);
    return { tipo: f.tipo, nombre, extraccion: null, autenticidad: vacia, error: r.error, tokens: 0, costo: 0 };
  }
  const autenticidad: Autenticidad = { ...revisarArchivo(bytes, mime, f.tipo), ...(await verificarEnLinea(f.tipo, r.datos)) };
  const doc: DocLeido = { tipo: f.tipo, nombre, extraccion: r.datos, autenticidad };
  const av = avisoVendedor(doc);
  await sb.from("cert_extracciones").insert({
    documento_id: f.id, certificado_id: f.certificado_id, campos: r.datos, paginas: r.datos.paginas ?? {}, confianza: Math.max(0, Math.min(1, Number(r.datos.confianza) || 0)),
    autenticidad, modelo: r.modelo, tokens_entrada: r.tokensEntrada, tokens_salida: r.tokensSalida,
  });
  await sb.from("cert_documentos").update({ estado: av.estado, aviso: av.aviso.slice(0, 600), tipo_detectado: r.datos.tipo_documento, leido_en: new Date().toISOString() }).eq("id", f.id);
  return { ...doc, tokens: r.tokensEntrada + r.tokensSalida, costo: costoUSD(r.tokensEntrada, r.tokensSalida) };
}

// Al subir un archivo: se lee de inmediato para avisarle al vendedor si sirve (se llama con after()).
export async function leerAlSubir(certId: string) {
  if (!iaActiva()) return;
  const c = await certificadoPorId(certId);
  if (!c || c.revision !== "pendiente_docs") return;
  const filas = await sincronizar(c);
  for (const f of filas ?? []) if (f.estado === "pendiente" || (f.estado === "error" && f.intentos < 3)) await leerFila(f, false, c.datos.rubro);
}

// Avisos de cada archivo para la página del vendedor.
export async function avisosDocumentos(certId: string) {
  const { data, error } = (await cliente()?.from("cert_documentos").select("path, estado, aviso").eq("certificado_id", certId)) ?? { data: null, error: true };
  if (error) return {} as Record<string, { estado: string; aviso: string | null }>;
  return Object.fromEntries((data ?? []).map((d) => [d.path as string, { estado: d.estado as string, aviso: d.aviso as string | null }]));
}

async function guardarLectura(id: string, lectura: LecturaCert) {
  await cliente()?.from("certificados_valorizacion").update({ lectura }).eq("id", id);
}

// Si el lector de texto de la carpeta no pudo (estado «revision»), se completa con lo que leyó la IA.
async function completarCarpeta(c: Certificado, k: ResultadoContraste) {
  const tok = c.documentos?.carpeta?.carpetaToken || c.datos.carpetaToken;
  if (!tok || k.f29.length < 6) return c;
  const carpeta = await carpetaPorToken(tok);
  if (!carpeta || carpeta.estado === "leida" || carpeta.estado === "verificada") return c;
  const u = k.f29.slice(0, 12), a = k.f29.slice(12, 24);
  const sb = cliente()!;
  const { data } = await sb.from("carpetas_tributarias").update({
    periodos: k.f29.slice(0, 36), ventas12: Math.round(u.reduce((s, m) => s + m.ventas, 0)), compras12: Math.round(u.reduce((s, m) => s + m.compras, 0)),
    ventas_ant12: a.length >= 6 ? Math.round(a.reduce((s, m) => s + m.ventas, 0) * 12 / a.length) : null, meses: u.length, ultimo: u[0].periodo,
    estado: "leida", nota: "Leída con IA (el lector de texto no pudo).",
  }).eq("id", carpeta.id).select("*").maybeSingle();
  if (!data) return c;
  const datos = { ...c.datos, ...datosDeCarpeta(data as never) };
  await sb.from("certificados_valorizacion").update({ datos }).eq("id", c.id);
  return { ...c, datos };
}

// Proceso completo de un certificado en revisión. Se llama al «Enviar a revisión» (after) y desde el cron.
export async function procesarCertificado(id: string, base: string, o: { forzar?: boolean; manual?: boolean } = {}) {
  if (!iaActiva()) return { error: "Falta ANTHROPIC_API_KEY." } as const;
  let c = await certificadoPorId(id);
  if (!c || planDe(c) === "standard") return { error: "Certificado no encontrado." } as const;
  if (c.revision !== "en_revision" && !o.manual) return { error: "No está en revisión." } as const;
  const previa = c.lectura ?? {};
  if (previa.estado === "procesando" && previa.iniciado && Date.now() - new Date(previa.iniciado).getTime() < 10 * 60_000) return { error: "Ya se está leyendo." } as const;
  const inicio: LecturaCert = { ...previa, estado: "procesando", iniciado: new Date().toISOString(), error: undefined };
  await guardarLectura(id, inicio);
  try {
    const filas = await sincronizar(c);
    if (!filas) return { error: "Falta la migración 0027." } as const;
    const leidos: Leido[] = [];
    // De a dos archivos a la vez (la carpeta y los certificados pesan poco; evita esperar uno por uno).
    for (let i = 0; i < filas.length; i += 2) leidos.push(...(await Promise.all(filas.slice(i, i + 2).map((f) => leerFila(f, o.forzar, c!.datos.rubro)))));
    const k0 = contrastar(c.datos, planDe(c), leidos);
    c = await completarCarpeta(c, k0);
    const k = contrastar(c.datos, planDe(c), leidos);
    const sb = cliente()!;
    await sb.from("cert_contrastes").delete().eq("certificado_id", id);
    if (k.filas.length) await sb.from("cert_contrastes").insert(k.filas.map((f) => ({
      certificado_id: id, campo: f.campo, etiqueta: f.etiqueta.slice(0, 160), declarado: f.declarado ?? null, oficial: f.oficial?.slice(0, 300) ?? null,
      diferencia: f.diferencia ?? null, resultado: f.resultado, fuente: f.fuente?.slice(0, 200) ?? null, detalle: f.detalle?.slice(0, 600) ?? null,
    })));
    const verificacion = { items: k.items, correcciones: k.correcciones };
    const valorVerificado = Math.round(analisisDe({ ...c, verificacion, revision: "verificado", revisado_en: new Date().toISOString() }).valor);
    const tokens = leidos.reduce((s, x) => s + x.tokens, 0) + (previa.tokens ?? 0);
    const lectura: LecturaCert = {
      estado: "listo", iniciado: inicio.iniciado, terminado: new Date().toISOString(), decision: k.decision, motivos: k.motivos.slice(0, 12),
      valorDeclarado: c.valor, valorVerificado, tokens, costoUSD: Math.round(((previa.costoUSD ?? 0) + leidos.reduce((s, x) => s + x.costo, 0)) * 1000) / 1000,
      aplicada: false,
    };
    // Decisión automática (solo si el certificado sigue en revisión y no la pidió el dueño a mano).
    if (modoAutomatico() && !o.manual && c.revision === "en_revision") {
      if (k.decision === "verificar") {
        lectura.auditoria = Math.random() < PROB_AUDITORIA;
        const corr = k.filas.filter((f) => f.resultado === "corregido");
        const nota = corr.length ? `Usamos las cifras de tus documentos: ${corr.map((f) => `${f.etiqueta.toLowerCase()} ${f.oficial}`).join("; ")}.` : "";
        await guardarLectura(id, { ...lectura, aplicada: true });
        await resolverRevision(id, "verificar", { nota, verificacion }, base);
        return { ok: true, decision: k.decision } as const;
      }
      if (k.decision === "pedir_correccion") {
        await guardarLectura(id, { ...lectura, aplicada: true });
        await resolverRevision(id, "corregir", { nota: k.motivos.slice(0, 8).join("\n"), verificacion }, base);
        return { ok: true, decision: k.decision } as const;
      }
    }
    await guardarLectura(id, lectura);
    if (!o.manual) await avisarDueno(c, k, lectura, base);
    return { ok: true, decision: k.decision } as const;
  } catch (e) {
    console.error("Lectura IA falló", e);
    await guardarLectura(id, { ...inicio, estado: "error", error: (e as Error).message.slice(0, 300) });
    return { error: "La lectura falló; se reintentará." } as const;
  }
}

async function avisarDueno(c: Certificado, k: ResultadoContraste, l: LecturaCert, base: string) {
  const p = PLANES_CERT[planDe(c)];
  const titulo = k.decision === "revision_humana" ? "Un certificado necesita tu revisión" : `Sugerencia: ${k.decision === "verificar" ? "verificar" : "pedir corrección"}`;
  await enviarCorreo(
    CORREO_CERTIFICADOS(),
    `${k.decision === "revision_humana" ? "Revisar" : "Sugerencia"}: valorización ${p.nombre} N° ${c.folio} · ${c.negocio}`,
    plantilla(titulo,
      `<p style="font-size:15px">La lectura automática de «${escapar(c.negocio)}» encontró:</p>
<ul style="font-size:14px;padding-left:18px">${(l.motivos ?? []).map((m) => `<li style="margin:4px 0">${escapar(m)}</li>`).join("") || "<li>Sin observaciones.</li>"}</ul>
<p style="font-size:14px;color:#5a6678">Valor declarado ${clp(l.valorDeclarado ?? 0)} · con documentos ${clp(l.valorVerificado ?? 0)}.</p>`,
      { texto: "Revisar en el panel", href: `${base}/admin` }),
  );
}

// Certificados en revisión que quedaron sin leer o con error (cron diario + al abrir la página del certificado o /admin/inscritos).
export async function procesarPendientes(base: string, max = 3) {
  if (!iaActiva()) return { procesados: 0, motivo: "sin ANTHROPIC_API_KEY" };
  const { data, error } = (await cliente()?.from("certificados_valorizacion").select("id, lectura").eq("revision", "en_revision").order("creado_en").limit(30)) ?? { data: null, error: true };
  if (error) return { procesados: 0, motivo: "falta la migración 0027" };
  const hace = (s?: string) => (s ? Date.now() - new Date(s).getTime() : Infinity);
  const pendientes = (data ?? []).filter((x) => {
    const l = (x.lectura ?? {}) as LecturaCert;
    return !l.estado || (l.estado === "procesando" && hace(l.iniciado) > 10 * 60_000) || (l.estado === "error" && hace(l.iniciado) > 15 * 60_000);
  }).slice(0, max);
  for (const x of pendientes) await procesarCertificado(x.id as string, base);
  return { procesados: pendientes.length };
}

// Datos para el panel del dueño.
export async function lecturaDe(certId: string) {
  const sb = cliente();
  if (!sb) return null;
  const [docs, ex, con] = await Promise.all([
    sb.from("cert_documentos").select("id, tipo, path, nombre, estado, tipo_detectado, aviso, leido_en").eq("certificado_id", certId),
    sb.from("cert_extracciones").select("documento_id, campos, autenticidad, confianza, modelo, creado_en").eq("certificado_id", certId).order("creado_en", { ascending: false }),
    sb.from("cert_contrastes").select("campo, etiqueta, declarado, oficial, diferencia, resultado, fuente, detalle").eq("certificado_id", certId).order("creado_en"),
  ]);
  if (docs.error) return null;
  return { documentos: docs.data ?? [], extracciones: ex.data ?? [], contrastes: con.data ?? [] };
}
