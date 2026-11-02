// Contraste automático entre lo declarado en /valoriza y lo que dicen los documentos (16 oct 2026).
// Módulo puro: recibe lo que la IA leyó de cada documento y devuelve filas de comparación, las cifras oficiales
// que reemplazan a las declaradas y una decisión. Las reglas son fijas (no las decide la IA): los mismos
// documentos siempre dan el mismo resultado.
//
// Decisión:
//   - pedir_correccion: falta un documento, no se lee, es otro documento, está vencido o es una foto de un
//     certificado que debe ser el PDF original. Se le pide al vendedor por correo, sin intervención del dueño.
//   - revision_humana: señales de alteración, RUT distintos entre documentos, el sistema de ventas y el SII no
//     calzan, margen fuera de lo normal o lectura dudosa. Solo estos casos llegan al dueño.
//   - verificar: todo lo demás. Las diferencias se corrigen con la cifra oficial y el certificado se verifica.

import { PLANES_CERT, type PlanCert, type TipoDocCert } from "./certificado";
import { ACEPTA, DIAS_VIGENCIA, NOMBRE_DETECTADO, SOLO_PDF_ORIGINAL, type Extraccion } from "./lectura-esquemas";
import type { DatosValorizacion } from "./valorizacion";

export type Resultado = "coincide" | "corregido" | "difiere" | "falta" | "alerta" | "info";
export type Fila = { campo: string; etiqueta: string; declarado?: string; oficial?: string; diferencia?: number; resultado: Resultado; fuente?: string; detalle?: string; tipo?: TipoDocCert };
export type Autenticidad = {
  formato: "pdf" | "imagen" | "otro";
  senalesArchivo: string[];            // revisión técnica del PDF (editado después de emitido, programa de edición…)
  firmado?: boolean;                   // tiene firma electrónica
  enLinea: "verificado" | "no_coincide" | "no_disponible" | "no_aplica";
  enLineaDetalle?: string;
};
export type DocLeido = { tipo: TipoDocCert; nombre: string; extraccion: Extraccion | null; autenticidad: Autenticidad; error?: string };
export type Decision = "verificar" | "pedir_correccion" | "revision_humana";
export type ResultadoContraste = {
  filas: Fila[];
  correcciones: Partial<Record<keyof DatosValorizacion, string>>;
  decision: Decision;
  motivos: string[];                   // por qué no se verificó solo (para el correo o el panel)
  items: Partial<Record<TipoDocCert, { ok: boolean; nota?: string }>>;
  oficial: { ventaNeta?: number; ventaNetaAnterior?: number; compraNeta?: number; mesesSII?: number; ventaSistema?: number; utilidadMax?: number };
  f29: { periodo: string; ventas: number; compras: number }[]; // para completar la carpeta si el lector de texto no pudo
};

// Tolerancias (ajustables con la experiencia).
export const TOL = {
  ventaCoincide: 0.05,      // hasta 5%: coincide
  sistemaVsSII: 0.15,       // más de 15% entre el sistema de ventas y el SII: revisión humana
  margenMaximo: 0.4,        // utilidad sobre venta neta mayor a 40%: revisión humana
  mesesContrato: 3,         // diferencia de meses de contrato que se acepta
  arriendo: 0.1,            // diferencia de renta que se acepta
  mesesMinimosSII: 6,
  confianzaMinima: 0.6,
};

const n = (v?: string | number | null) => (typeof v === "number" ? v : Math.max(0, Number(String(v ?? "").replace(/\D/g, "")) || 0));
const clp = (x: number) => "$" + Math.round(x).toLocaleString("es-CL");
const pct = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")}%`;
const rel = (a: number, b: number) => (b ? Math.abs(a - b) / b : a ? 1 : 0);

export function rutNormal(r?: string | null) {
  const m = String(r ?? "").toUpperCase().replace(/[^0-9K]/g, "");
  return m.length >= 2 ? `${m.slice(0, -1)}-${m.slice(-1)}` : "";
}
export function rutValido(r?: string | null) {
  const x = rutNormal(r);
  if (!x) return false;
  const [cuerpo, dv] = x.split("-");
  let suma = 0, mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) { suma += Number(cuerpo[i]) * mult; mult = mult === 7 ? 2 : mult + 1; }
  const r11 = 11 - (suma % 11);
  return dv === (r11 === 11 ? "0" : r11 === 10 ? "K" : String(r11));
}
const rutTxt = (r: string) => r.replace(/^(\d+)-/, (_, c: string) => `${Number(c).toLocaleString("es-CL")}-`);

const dia = (s?: string | null) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? new Date(`${s.slice(0, 10)}T12:00:00`) : null);
const mesesEntre = (desde: Date, hasta: Date) => (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth()) - (hasta.getDate() < desde.getDate() ? 1 : 0);

// Dirección comparable: sin tildes ni palabras de relleno; se comparan los números (calle y local).
const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const numeros = (s?: string | null) => new Set((sinTildes(s ?? "").match(/\d{2,5}/g) ?? []));

// Revisión de un archivo por sí solo: se usa al subirlo (aviso inmediato al vendedor) y en el contraste final.
export function chequearArchivo(d: DocLeido, hoy = new Date()): { filas: Fila[]; valido: boolean } {
  const t = d.tipo, x = d.extraccion;
  const filas: Fila[] = [];
  const base = { campo: `doc_${t}`, etiqueta: d.nombre, tipo: t, fuente: d.nombre };
  const corta = (resultado: Resultado, detalle: string) => ({ filas: [{ ...base, resultado, detalle }], valido: false });
  if (!x) return corta("alerta", d.error ? `No se pudo leer automáticamente: ${d.error}` : "No se pudo leer automáticamente.");
  if (!x.legible) return corta("falta", "No se lee con claridad. Sube una versión más nítida o el PDF original.");
  if (!ACEPTA[t].includes(x.tipo_documento)) return corta("falta", `Parece ${NOMBRE_DETECTADO[x.tipo_documento]}, no lo que se pidió en este lugar.`);
  if (SOLO_PDF_ORIGINAL.includes(t) && d.autenticidad.formato !== "pdf") return corta("falta", "Es una foto o un escaneo. Sube el PDF original descargado del sitio oficial: así se puede comprobar.");
  const maxDias = DIAS_VIGENCIA[t];
  const emitido = dia(x.fecha_emision);
  if (maxDias && !emitido) return corta("falta", "No se ve la fecha de emisión. Sube el documento completo.");
  if (maxDias && emitido) {
    const dias = Math.floor((hoy.getTime() - emitido.getTime()) / 864e5);
    if (dias > maxDias) return corta("falta", `Fue emitido hace ${dias} días. Sube uno de menos de ${maxDias} días.`);
    if (dias < -2) return corta("alerta", `La fecha de emisión (${x.fecha_emision}) es posterior a hoy.`);
  }
  const oficialTipo = SOLO_PDF_ORIGINAL.includes(t);
  if (x.confianza < TOL.confianzaMinima) filas.push({ ...base, resultado: "alerta", detalle: `Lectura poco segura (${Math.round(x.confianza * 100)}%).` });
  if (x.senales_alteracion?.length) filas.push({ ...base, resultado: oficialTipo ? "alerta" : "info", detalle: `Señales visibles de modificación: ${x.senales_alteracion.join("; ")}.` });
  if (d.autenticidad.senalesArchivo.length) filas.push({ ...base, resultado: oficialTipo ? "alerta" : "info", detalle: `Revisión del archivo: ${d.autenticidad.senalesArchivo.join("; ")}.` });
  if (d.autenticidad.enLinea === "no_coincide") filas.push({ ...base, resultado: "alerta", detalle: `El código no coincide en el sitio oficial. ${d.autenticidad.enLineaDetalle ?? ""}`.trim() });
  if (d.autenticidad.enLinea === "verificado") filas.push({ ...base, resultado: "coincide", detalle: `Comprobado en el sitio oficial. ${d.autenticidad.enLineaDetalle ?? ""}`.trim() });
  if (!filas.length) filas.push({ ...base, resultado: "coincide", detalle: x.resumen || "Leído." });
  return { filas, valido: true };
}

// Mensaje para el vendedor justo después de subir un archivo (no menciona las revisiones internas de autenticidad).
export function avisoVendedor(d: DocLeido, hoy = new Date()): { estado: "leido" | "observado"; aviso: string } {
  const r = chequearArchivo(d, hoy);
  const falta = r.filas.find((f) => f.resultado === "falta");
  if (falta) return { estado: "observado", aviso: falta.detalle ?? "Revisa este archivo." };
  const x = d.extraccion;
  const fecha = x?.fecha_emision ? ` emitido el ${x.fecha_emision.split("-").reverse().join("-")}` : "";
  const meses = x?.f29?.length ? ` con ${x.f29.length} meses de F29` : x?.meses?.length ? ` con ${x.meses.length} meses de ventas` : "";
  return { estado: "leido", aviso: `Leído: ${NOMBRE_DETECTADO[x?.tipo_documento ?? "otro"]}${fecha}${meses}.` };
}

export function contrastar(datos: DatosValorizacion, plan: PlanCert, docs: DocLeido[], hoy = new Date()): ResultadoContraste {
  const filas: Fila[] = [];
  const correcciones: ResultadoContraste["correcciones"] = {};
  const oficial: ResultadoContraste["oficial"] = {};
  const fila = (f: Fila) => filas.push(f);
  const requeridos = PLANES_CERT[plan].docs;
  const conRS = datos.conRazonSocial === "si";

  // ---------- 1. Cada archivo: ¿es el documento correcto, se lee, está vigente, parece original? ----------
  const validos: Partial<Record<TipoDocCert, DocLeido[]>> = {};
  for (const t of requeridos) {
    const propios = docs.filter((d) => d.tipo === t);
    if (!propios.length) { fila({ campo: `doc_${t}`, etiqueta: "Documento", resultado: "falta", tipo: t, detalle: "No se subió." }); continue; }
    for (const d of propios) {
      const r = chequearArchivo(d, hoy);
      filas.push(...r.filas);
      if (r.valido) (validos[t] ??= []).push(d);
    }
  }
  const uno = (t: TipoDocCert) => validos[t]?.[0]?.extraccion ?? null;

  // ---------- 2. Identidad: los certificados oficiales deben ser del mismo RUT ----------
  const ruts = new Map<string, string[]>();
  for (const t of ["carpeta", "tgr", "f30", "patente", "ventas_sistema"] as TipoDocCert[]) {
    const r = rutNormal(uno(t)?.rut);
    if (r) ruts.set(r, [...(ruts.get(r) ?? []), t]);
  }
  for (const r of ruts.keys()) if (!rutValido(r)) fila({ campo: "rut", etiqueta: "RUT", oficial: rutTxt(r), resultado: "alerta", detalle: "El dígito verificador no corresponde: revisar si el documento fue modificado." });
  if (ruts.size > 1) {
    fila({ campo: "rut", etiqueta: "RUT del negocio", oficial: [...ruts].map(([r, ts]) => `${rutTxt(r)} (${ts.join(", ")})`).join(" · "), resultado: "alerta", detalle: "Los documentos oficiales tienen RUT distintos." });
  } else if (ruts.size === 1) {
    const [r] = [...ruts.keys()];
    fila({ campo: "rut", etiqueta: "RUT del negocio", oficial: rutTxt(r), resultado: "coincide", detalle: "Todos los documentos son del mismo RUT." });
    const ra = rutNormal(uno("arriendo")?.rut_arrendatario);
    if (ra && ra !== r) fila({ campo: "rut_arriendo", etiqueta: "Arrendatario del local", oficial: `${uno("arriendo")?.arrendatario ?? ""} ${rutTxt(ra)}`.trim(), resultado: "info", detalle: "El contrato de arriendo está a nombre de otro RUT (por ejemplo, el dueño como persona). La cesión del contrato debe quedar resuelta en la compra.", tipo: "arriendo" });
  }

  // ---------- 3. Ventas: el SII manda ----------
  const decl = n(datos.ventaNeta) || n(datos.ventaMensual) / 1.19;
  const c = uno("carpeta");
  let f29 = (c?.f29 ?? [])
    .filter((m) => /^\d{4}-\d{2}$/.test(m.periodo) && !m.sin_declaracion && (m.ventas_netas ?? null) !== null)
    .map((m) => ({ periodo: m.periodo, ventas: Math.max(0, n(m.ventas_netas)), compras: Math.max(0, n(m.compras_netas ?? (m.credito_iva ? m.credito_iva / 0.19 : 0))) }));
  f29 = [...new Map(f29.map((m) => [m.periodo, m])).values()].sort((a, b) => b.periodo.localeCompare(a.periodo));
  const ult12 = f29.slice(0, 12), ant12 = f29.slice(12, 24);
  let ventaSII = 0, compraSII = 0, mesesSII = 0, fuenteSII = "";
  if (ult12.length >= TOL.mesesMinimosSII) {
    mesesSII = ult12.length;
    ventaSII = ult12.reduce((s, m) => s + m.ventas, 0) / mesesSII;
    compraSII = ult12.reduce((s, m) => s + m.compras, 0) / mesesSII;
    fuenteSII = `Carpeta tributaria (F29 de ${mesesSII} meses, hasta ${ult12[0].periodo})`;
    if (ant12.length >= TOL.mesesMinimosSII) oficial.ventaNetaAnterior = ant12.reduce((s, m) => s + m.ventas, 0) / ant12.length;
  } else if (n(datos.carpetaMeses) >= TOL.mesesMinimosSII && datos.carpetaEstado === "leida") {
    // Lectura de texto de la carpeta (lib/carpeta.ts) como respaldo.
    mesesSII = n(datos.carpetaMeses);
    ventaSII = n(datos.carpetaVentas12) / mesesSII;
    compraSII = n(datos.carpetaCompras12) / mesesSII;
    fuenteSII = `Carpeta tributaria (lectura de texto, ${mesesSII} meses)`;
  }
  if (requeridos.includes("carpeta") && validos.carpeta && !mesesSII) {
    fila({ campo: "ventaNeta", etiqueta: "Venta neta mensual", resultado: "falta", tipo: "carpeta", detalle: `La carpeta no trae al menos ${TOL.mesesMinimosSII} meses de F29. Genera la carpeta «para solicitar créditos», que incluye 24 meses.` });
  }
  if (mesesSII) {
    oficial.ventaNeta = ventaSII; oficial.compraNeta = compraSII; oficial.mesesSII = mesesSII;
    const d = rel(decl, ventaSII);
    if (d <= TOL.ventaCoincide) fila({ campo: "ventaNeta", etiqueta: "Venta neta mensual", declarado: clp(decl), oficial: clp(ventaSII), diferencia: d, resultado: "coincide", fuente: fuenteSII, tipo: "carpeta", detalle: "Ventas verificadas con el SII." });
    else {
      correcciones.ventaNeta = String(Math.round(ventaSII));
      fila({ campo: "ventaNeta", etiqueta: "Venta neta mensual", declarado: clp(decl), oficial: clp(ventaSII), diferencia: d, resultado: "corregido", fuente: fuenteSII, tipo: "carpeta", detalle: `Difiere ${pct(d)}: se usa la venta declarada al SII.` });
    }
    if (oficial.ventaNetaAnterior) {
      const da = n(datos.ventaNetaAnterior);
      if (!da || rel(da, oficial.ventaNetaAnterior) > TOL.ventaCoincide) correcciones.ventaNetaAnterior = String(Math.round(oficial.ventaNetaAnterior));
      fila({ campo: "ventaNetaAnterior", etiqueta: "Venta neta de hace 12 meses", declarado: da ? clp(da) : "—", oficial: clp(oficial.ventaNetaAnterior), diferencia: da ? rel(da, oficial.ventaNetaAnterior) : undefined, resultado: correcciones.ventaNetaAnterior ? "corregido" : "coincide", fuente: fuenteSII, tipo: "carpeta", detalle: "Se usa para el crecimiento." });
    }
  }

  // Sistema de ventas contra el SII, mes a mes en los meses que tienen en común.
  const meses = (validos.ventas_sistema ?? []).flatMap((x) => x.extraccion?.meses ?? [])
    .filter((m) => /^\d{4}-\d{2}$/.test(m.periodo))
    .map((m) => ({ periodo: m.periodo, neta: m.venta_neta != null ? n(m.venta_neta) : n(m.venta_bruta) / 1.19 }))
    .filter((m) => m.neta > 0);
  const sis = [...new Map(meses.map((m) => [m.periodo, m])).values()].sort((a, b) => b.periodo.localeCompare(a.periodo)).slice(0, 12);
  if (sis.length) {
    oficial.ventaSistema = sis.reduce((s, m) => s + m.neta, 0) / sis.length;
    const comunes = sis.filter((m) => f29.some((f) => f.periodo === m.periodo));
    const nombreSis = uno("ventas_sistema")?.sistema || "Sistema de ventas";
    if (comunes.length >= 3) {
      const a = comunes.reduce((s, m) => s + m.neta, 0);
      const b = comunes.reduce((s, m) => s + (f29.find((f) => f.periodo === m.periodo)?.ventas ?? 0), 0);
      const d = rel(a, b);
      fila({
        campo: "ventaSistema", etiqueta: `${nombreSis} vs SII (${comunes.length} meses)`, declarado: clp(a / comunes.length), oficial: clp(b / comunes.length), diferencia: d,
        resultado: d <= TOL.ventaCoincide ? "coincide" : d <= TOL.sistemaVsSII ? "info" : "alerta", fuente: "Reporte del sistema y F29", tipo: "ventas_sistema",
        detalle: d <= TOL.ventaCoincide ? "Dos fuentes independientes muestran las mismas ventas." : d <= TOL.sistemaVsSII ? `Difieren ${pct(d)}: diferencia menor (anulaciones, propinas o fechas de cierre).` : `Difieren ${pct(d)}: el sistema y lo declarado al SII no calzan.`,
      });
    } else if (mesesSII) {
      fila({ campo: "ventaSistema", etiqueta: nombreSis, declarado: clp(oficial.ventaSistema), resultado: "info", tipo: "ventas_sistema", detalle: "El reporte no tiene meses en común con la carpeta para compararlos uno a uno." });
    } else {
      // Sin carpeta legible, el sistema de ventas es la mejor referencia (solo informativa).
      const d = rel(decl, oficial.ventaSistema);
      fila({ campo: "ventaNeta", etiqueta: "Venta neta mensual (sistema)", declarado: clp(decl), oficial: clp(oficial.ventaSistema), diferencia: d, resultado: d <= TOL.ventaCoincide ? "coincide" : "info", tipo: "ventas_sistema" });
    }
  }

  // ---------- 4. Utilidad: coherente con lo tributario (no se puede «verificar»: el SII no la informa mes a mes) ----------
  const U = n(datos.utilidadMensual);
  const ventaFinal = n(correcciones.ventaNeta) || decl;
  if (mesesSII && U) {
    const a = uno("arriendo");
    const valorUF = n(datos.valorUF);
    const rentaContrato = a ? (n(a.renta_mensual) || (a.renta_uf && valorUF ? a.renta_uf * valorUF : 0)) : 0;
    const arriendo = rentaContrato || n(datos.arriendo);
    const maximo = Math.max(0, ventaSII - compraSII - arriendo - n(datos.gastoComun));
    oficial.utilidadMax = maximo;
    if (U <= maximo) fila({ campo: "utilidadMensual", etiqueta: "Utilidad mensual", declarado: clp(U), oficial: `hasta ${clp(maximo)}`, resultado: "coincide", fuente: "Ventas y compras del SII menos arriendo", detalle: "Utilidad coherente con lo tributario: cabe dentro de ventas menos compras y arriendo." });
    else {
      correcciones.utilidadMensual = String(Math.round(maximo));
      fila({ campo: "utilidadMensual", etiqueta: "Utilidad mensual", declarado: clp(U), oficial: `hasta ${clp(maximo)}`, diferencia: rel(U, maximo), resultado: "corregido", fuente: "Ventas y compras del SII menos arriendo", detalle: "La utilidad declarada es mayor que ventas menos compras y arriendo según el SII: se usa ese máximo." });
    }
    const Ufinal = Math.min(U, maximo);
    if (ventaFinal && Ufinal / ventaFinal > TOL.margenMaximo) fila({ campo: "margen", etiqueta: "Margen de utilidad", oficial: pct(Ufinal / ventaFinal), resultado: "alerta", detalle: `Más de ${pct(TOL.margenMaximo)} de la venta neta es poco común en un negocio de este tamaño: revisar sueldos y costos.` });
    const f22 = [...(c?.f22 ?? [])].filter((x) => n(x.renta_liquida_imponible) > 0).sort((x, y) => y.ano_tributario - x.ano_tributario)[0];
    if (f22) {
      const rli = n(f22.renta_liquida_imponible) / 12;
      const veces = Ufinal / rli;
      fila({ campo: "f22", etiqueta: `Renta líquida F22 (AT ${f22.ano_tributario})`, declarado: clp(Ufinal), oficial: `${clp(rli)} al mes`, resultado: "info", fuente: "F22 en la carpeta", detalle: veces > 3 ? `La utilidad es ${veces.toFixed(1).replace(".", ",")} veces la renta tributaria. Es común si el dueño retira utilidades o hay gastos tributarios; el comprador lo va a preguntar.` : "En línea con la renta declarada." });
    }
  }

  // ---------- 5. Deudas (Platinum): lo oficial reemplaza a lo declarado cuando es mayor ----------
  const deuda = (campo: "deudaTributaria" | "deudaLaboral" | "deudaFinanciera", etiqueta: string, monto: number, tipo: TipoDocCert, fuente: string) => {
    const declarado = datos[campo] === "si" ? n(datos[`${campo}Monto` as keyof DatosValorizacion] as string) : 0;
    if (monto > declarado + 1000) {
      correcciones[campo] = "si";
      correcciones[`${campo}Monto` as keyof DatosValorizacion] = String(Math.round(monto));
      fila({ campo, etiqueta, declarado: clp(declarado), oficial: clp(monto), resultado: "corregido", fuente, tipo, detalle: "El documento muestra más deuda que la declarada: se descuenta la oficial." });
    } else fila({ campo, etiqueta, declarado: clp(declarado), oficial: clp(monto), resultado: "coincide", fuente, tipo, detalle: monto === 0 ? "Sin deuda." : undefined });
  };
  const tgr = uno("tgr");
  if (tgr) {
    if (tgr.tiene_deuda_fiscal == null) fila({ campo: "deudaTributaria", etiqueta: "Deuda fiscal (Tesorería)", resultado: "alerta", tipo: "tgr", detalle: "No se pudo leer si registra deuda." });
    else deuda("deudaTributaria", "Deuda fiscal (Tesorería)", tgr.tiene_deuda_fiscal ? n(tgr.monto_deuda_fiscal) : 0, "tgr", "Certificado de la Tesorería");
  }
  const f30 = uno("f30");
  if (f30) deuda("deudaLaboral", "Multas y deuda previsional (F30)", n(f30.multas_impagas) + n(f30.deuda_previsional), "f30", "Certificado F30");
  const dicom = uno("dicom");
  if (dicom) {
    const total = dicom.total_morosidad != null ? n(dicom.total_morosidad) : (dicom.deudas_comerciales ?? []).reduce((s, x) => s + n(x.monto), 0);
    const delNegocio = conRS && (!ruts.size || ruts.has(rutNormal(dicom.rut)));
    if (delNegocio) deuda("deudaFinanciera", "Morosidades comerciales (Dicom)", total, "dicom", "Informe Dicom");
    else fila({ campo: "dicom", etiqueta: "Morosidades comerciales (Dicom)", oficial: clp(total), resultado: total ? "info" : "coincide", tipo: "dicom", fuente: "Informe Dicom",
      detalle: total ? "Son del titular y no pasan al comprador si no se vende la empresa, pero muestran el riesgo del vendedor." : "Sin morosidades." });
    if (n(dicom.protestos)) fila({ campo: "protestos", etiqueta: "Protestos", oficial: String(n(dicom.protestos)), resultado: "info", tipo: "dicom" });
  }

  // ---------- 6. Contrato de arriendo ----------
  const a = uno("arriendo");
  if (a) {
    const termino = dia(a.fecha_termino);
    if (!termino) fila({ campo: "mesesRestantes", etiqueta: "Meses de contrato", resultado: "alerta", tipo: "arriendo", detalle: "No se encontró la fecha de término del contrato." });
    else {
      const m = Math.max(0, mesesEntre(hoy, termino));
      const dm = n(datos.mesesRestantes);
      if (m === 0 && !a.renovacion_automatica) fila({ campo: "mesesRestantes", etiqueta: "Meses de contrato", declarado: String(dm), oficial: `vence ${a.fecha_termino}`, resultado: "alerta", tipo: "arriendo", detalle: "El contrato está vencido y no se renueva solo." });
      else if (Math.abs(m - dm) <= TOL.mesesContrato) fila({ campo: "mesesRestantes", etiqueta: "Meses de contrato", declarado: String(dm), oficial: String(m), resultado: "coincide", tipo: "arriendo", fuente: `Término ${a.fecha_termino}` });
      else {
        correcciones.mesesRestantes = String(m);
        fila({ campo: "mesesRestantes", etiqueta: "Meses de contrato", declarado: String(dm), oficial: String(m), resultado: "corregido", tipo: "arriendo", fuente: `Término ${a.fecha_termino}${a.renovacion_automatica ? " (se renueva solo)" : ""}`, detalle: "Se usan los meses que quedan según el contrato." });
      }
    }
    const valorUF = n(datos.valorUF);
    const renta = n(a.renta_mensual) || (a.renta_uf && valorUF ? a.renta_uf * valorUF : 0);
    const dr = n(datos.arriendo);
    if (renta) {
      const d = rel(dr, renta);
      if (d <= TOL.arriendo) fila({ campo: "arriendo", etiqueta: "Arriendo mensual", declarado: clp(dr), oficial: clp(renta), diferencia: d, resultado: "coincide", tipo: "arriendo" });
      else { correcciones.arriendo = String(Math.round(renta)); fila({ campo: "arriendo", etiqueta: "Arriendo mensual", declarado: clp(dr), oficial: clp(renta), diferencia: d, resultado: "corregido", tipo: "arriendo", detalle: a.renta_uf ? `Renta de ${a.renta_uf} UF.` : undefined }); }
    }
    if (!conRS && a.cesion) {
      if (a.cesion === "no" && datos.autorizaCesion !== "no") { correcciones.autorizaCesion = "no"; fila({ campo: "autorizaCesion", etiqueta: "Cesión del contrato", declarado: datos.autorizaCesion || "—", oficial: "prohibida", resultado: "corregido", tipo: "arriendo", detalle: "El contrato prohíbe ceder: el comprador debe negociar un contrato nuevo con el arrendador." }); }
      else if (a.cesion === "con_autorizacion" && datos.autorizaCesion === "si") fila({ campo: "autorizaCesion", etiqueta: "Cesión del contrato", declarado: "sí", oficial: "requiere autorización", resultado: "info", tipo: "arriendo", detalle: "El contrato pide autorización del arrendador: el comprador debe exigirla por escrito." });
      else fila({ campo: "autorizaCesion", etiqueta: "Cesión del contrato", declarado: datos.autorizaCesion || "—", oficial: a.cesion.replace("_", " "), resultado: "coincide", tipo: "arriendo" });
    }
    if (datos.contratoNotarial === "si" && a.notarial === false) { correcciones.contratoNotarial = "no"; fila({ campo: "contratoNotarial", etiqueta: "Firmas ante notario", declarado: "sí", oficial: "no", resultado: "corregido", tipo: "arriendo" }); }
    if (a.firmado === false) fila({ campo: "firmado", etiqueta: "Contrato firmado", oficial: "sin firmas visibles", resultado: "falta", tipo: "arriendo", detalle: "Sube el contrato firmado por ambas partes." });
  }

  // ---------- 7. Patente municipal ----------
  const p = uno("patente");
  if (p?.tipo_patente) {
    const esMef = p.tipo_patente === "mef";
    const tipo = esMef ? (datos.patente || "definitiva") : p.tipo_patente === "provisoria" ? "provisoria" : "definitiva";
    if (datos.patente !== tipo) { correcciones.patente = tipo; fila({ campo: "patente", etiqueta: "Patente municipal", declarado: datos.patente || "—", oficial: p.tipo_patente, resultado: "corregido", tipo: "patente" }); }
    else fila({ campo: "patente", etiqueta: "Patente municipal", declarado: datos.patente, oficial: p.tipo_patente, resultado: "coincide", tipo: "patente" });
    if (esMef && datos.mef !== "si") { correcciones.mef = "si"; fila({ campo: "mef", etiqueta: "Microempresa familiar (MEF)", declarado: "no", oficial: "sí", resultado: "corregido", tipo: "patente", detalle: "La patente es MEF: está amarrada a la casa de la familia." }); }
    const pagada = dia(p.pagada_hasta);
    if (pagada && pagada < hoy) fila({ campo: "patentePagada", etiqueta: "Pago de la patente", oficial: `pagada hasta ${p.pagada_hasta}`, resultado: "info", tipo: "patente", detalle: "Sube el comprobante del último semestre si ya está pagada." });
    const np = numeros(p.direccion), na = numeros(a?.direccion);
    if (np.size && na.size && ![...np].some((x) => na.has(x))) fila({ campo: "direccion", etiqueta: "Dirección del local", declarado: a?.direccion ?? "", oficial: p.direccion ?? "", resultado: "alerta", tipo: "patente", detalle: "La patente y el contrato de arriendo tienen direcciones distintas." });
    else if (np.size && na.size) fila({ campo: "direccion", etiqueta: "Dirección del local", oficial: p.direccion ?? "", resultado: "coincide", detalle: "La patente y el contrato son del mismo local." });
  }

  // ---------- 8. Respuestas del valorizador que los documentos confirman o corrigen (16 oct) ----------
  // Cada una mueve puntos del valorizador: si el documento dice otra cosa, manda el documento.
  const SN_TXT: Record<string, string> = { si: "sí", no: "no", "": "—", pareja: "parejas", temporada: "suben en una temporada", alta: "dependen de una temporada" };
  const fijar = (campo: keyof DatosValorizacion, etiqueta: string, oficialVal: string, tipo: TipoDocCert, fuente: string, detalle?: string) => {
    const dv = String(datos[campo] ?? "");
    if (dv === oficialVal) fila({ campo, etiqueta, declarado: SN_TXT[dv] ?? dv, oficial: SN_TXT[oficialVal] ?? oficialVal, resultado: "coincide", tipo, fuente });
    else { correcciones[campo] = oficialVal; fila({ campo, etiqueta, declarado: SN_TXT[dv] ?? (dv || "—"), oficial: SN_TXT[oficialVal] ?? oficialVal, resultado: "corregido", tipo, fuente, detalle: detalle ?? "Se usa lo que dice el documento." }); }
  };
  if (c) {
    const ini = dia(c.inicio_actividades);
    if (ini) {
      const anos = Math.max(0, Math.floor(mesesEntre(ini, hoy) / 12));
      const da = n(datos.anosFuncionando);
      if (datos.anosFuncionando === "" || Math.abs(anos - da) >= 1) { correcciones.anosFuncionando = String(anos); fila({ campo: "anosFuncionando", etiqueta: "Años funcionando", declarado: datos.anosFuncionando || "—", oficial: `${anos} (inicio de actividades ${c.inicio_actividades})`, resultado: "corregido", tipo: "carpeta", fuente: "Carpeta tributaria" }); }
      else fila({ campo: "anosFuncionando", etiqueta: "Años funcionando", declarado: String(da), oficial: String(anos), resultado: "coincide", tipo: "carpeta", fuente: "Inicio de actividades" });
    }
    if (ult12.length >= TOL.mesesMinimosSII) {
      const desde = ult12[ult12.length - 1].periodo;
      const faltan = (c.f29 ?? []).filter((m) => m.sin_declaracion && m.periodo >= desde).length;
      fijar("f29AlDia", "F29 al día (12 meses)", faltan ? "no" : "si", "carpeta", "Carpeta tributaria", faltan ? `${faltan} meses sin declaración en la carpeta.` : undefined);
      correcciones.carpetaTributaria = "si";
    }
    if (ult12.length >= 12) {
      const v = ult12.map((m) => m.ventas).filter((x) => x > 0);
      const ratio = v.length ? Math.min(...v) / Math.max(...v) : 1;
      const est = ratio >= 0.7 ? "pareja" : ratio >= 0.45 ? "temporada" : "alta";
      fijar("estacionalidad", "Ventas durante el año", est, "carpeta", "F29 mes a mes", `El mes más bajo vende ${Math.round(ratio * 100)}% del más alto.`);
    }
  }
  if (tgr && tgr.tiene_deuda_fiscal != null) fijar("certificadoTgr", "Certificado de la Tesorería sin deudas", tgr.tiene_deuda_fiscal ? "no" : "si", "tgr", "Certificado de la Tesorería");
  if (f30) {
    const malo = n(f30.multas_impagas) + n(f30.deuda_previsional) > 0 || f30.sin_anotaciones === false;
    if (datos.conRazonSocial === "si" || datos.trabajadoresPasan === "si") fijar("remuneracionesAlDia", "Remuneraciones y cotizaciones al día", malo ? "no" : "si", "f30", "Certificado F30");
    if (f30.trabajadores != null && n(datos.trabajadores) && Math.abs(n(f30.trabajadores) - n(datos.trabajadores)) >= 2) fila({ campo: "trabajadores", etiqueta: "Trabajadores", declarado: String(n(datos.trabajadores)), oficial: String(n(f30.trabajadores)), resultado: "info", tipo: "f30", fuente: "Certificado F30" });
  }
  if (dicom) fijar("morosidades", "Morosidades o protestos (Dicom)", n(dicom.total_morosidad) + n(dicom.protestos) + (dicom.deudas_comerciales ?? []).reduce((s, x) => s + n(x.monto), 0) > 0 ? "si" : "no", "dicom", "Informe Dicom");
  if (a) {
    if (a.renovacion_automatica != null) fijar("renovacion", "Renovación del contrato", a.renovacion_automatica ? "si" : (datos.renovacion || "no"), "arriendo", "Contrato de arriendo");
    if (a.termino_anticipado != null) fijar("terminoAnticipado", "El arrendador puede terminarlo antes sin causa", a.termino_anticipado ? "si" : "no", "arriendo", "Contrato de arriendo",
      a.termino_anticipado ? "El contrato permite al arrendador terminarlo con solo avisar: es el mayor riesgo para quien compra." : undefined);
    if (a.notarial === true && datos.contratoNotarial !== "si") fijar("contratoNotarial", "Firmas ante notario", "si", "arriendo", "Contrato de arriendo");
    if (a.reajuste) fila({ campo: "reajuste", etiqueta: "Reajuste de la renta", oficial: a.reajuste, resultado: "info", tipo: "arriendo" });
  }
  if (p?.giro_cubre_rubro != null) fijar("patenteGiro", "Giro de la patente cubre lo que vende", p.giro_cubre_rubro ? "si" : "no", "patente", `Patente${p.giro ? `: ${p.giro}` : ""}`);
  if (sis.length) {
    const sel = datos.sistemas.split(",").filter(Boolean);
    if (!sel.includes("pos")) { correcciones.sistemas = [...sel, "pos"].join(","); fila({ campo: "sistemas", etiqueta: "Punto de venta electrónico", declarado: "no", oficial: "sí", resultado: "corregido", tipo: "ventas_sistema", detalle: "El reporte de ventas muestra que usa un sistema de punto de venta." }); }
  }

  // ---------- 9. Decisión ----------
  const faltas = filas.filter((f) => f.resultado === "falta");
  const alertas = filas.filter((f) => f.resultado === "alerta");
  const decision: Decision = faltas.length ? "pedir_correccion" : alertas.length ? "revision_humana" : "verificar";
  const motivos = (faltas.length ? faltas : alertas).map((f) => `${f.tipo ? `${f.etiqueta}: ` : `${f.etiqueta}: `}${f.detalle ?? ""}`.trim());
  const items: ResultadoContraste["items"] = {};
  for (const t of requeridos) {
    const propias = filas.filter((f) => f.tipo === t);
    const mala = propias.find((f) => f.resultado === "falta" || f.resultado === "alerta");
    const corr = propias.filter((f) => f.resultado === "corregido").map((f) => `${f.etiqueta}: ${f.oficial}`);
    items[t] = { ok: !mala, nota: mala?.detalle ?? (corr.length ? `Corregido con el documento: ${corr.join("; ")}.` : undefined) };
  }
  return { filas, correcciones, decision, motivos, items, oficial, f29 };
}
