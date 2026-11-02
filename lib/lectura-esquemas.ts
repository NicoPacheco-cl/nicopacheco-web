// Formularios que la IA llena al leer cada documento de una valorización Gold o Platinum (16 oct 2026).
// Módulo puro: lo usan el servidor (lectura) y el contraste (lib/contraste.ts).

import type { TipoDocCert } from "./certificado";

export type TipoDetectado = TipoDocCert | "f29" | "f22" | "otro";

// Campos comunes a todos los documentos.
export type Comun = {
  tipo_documento: TipoDetectado;
  legible: boolean;
  rut?: string | null;            // RUT del negocio o de su dueño que aparece como titular
  razon_social?: string | null;
  fecha_emision?: string | null;  // AAAA-MM-DD
  emisor?: string | null;         // SII, Tesorería, Dirección del Trabajo, Equifax, municipalidad, sistema de ventas…
  codigo_verificacion?: string | null;
  folio?: string | null;
  url_verificacion?: string | null;
  senales_alteracion?: string[];  // tipografías distintas, cifras sobrepuestas, páginas cortadas, recortes, etc.
  confianza: number;              // 0 a 1
  paginas?: Record<string, number>;
  resumen?: string;               // una frase para el panel
};
export type MesVenta = { periodo: string; venta_neta?: number | null; venta_bruta?: number | null };
export type MesF29 = { periodo: string; ventas_netas?: number | null; debito_iva?: number | null; compras_netas?: number | null; credito_iva?: number | null; sin_declaracion?: boolean };
export type Extraccion = Comun & {
  // ventas_sistema
  sistema?: string | null; meses?: MesVenta[];
  // carpeta (F29 de 24 meses y F22)
  f29?: MesF29[]; f22?: { ano_tributario: number; renta_liquida_imponible?: number | null; ingresos_brutos?: number | null }[];
  giro?: string | null; inicio_actividades?: string | null; direccion?: string | null;
  // dicom
  deudas_comerciales?: { acreedor?: string | null; tipo?: string | null; monto?: number | null; fecha?: string | null }[]; total_morosidad?: number | null; protestos?: number | null;
  // tgr
  tiene_deuda_fiscal?: boolean | null; monto_deuda_fiscal?: number | null;
  // f30
  multas_impagas?: number | null; deuda_previsional?: number | null; trabajadores?: number | null; sin_anotaciones?: boolean | null;
  // arriendo
  arrendador?: string | null; arrendatario?: string | null; rut_arrendatario?: string | null; fecha_inicio?: string | null; fecha_termino?: string | null;
  plazo_meses?: number | null; renovacion_automatica?: boolean | null; renta_mensual?: number | null; moneda?: "clp" | "uf" | null; renta_uf?: number | null;
  cesion?: "si" | "con_autorizacion" | "no" | "no_dice" | null; notarial?: boolean | null; firmado?: boolean | null;
  termino_anticipado?: boolean | null; reajuste?: string | null; garantia?: number | null;
  // patente
  tipo_patente?: "definitiva" | "provisoria" | "mef" | "alcoholes" | "otra" | null; comuna?: string | null; rol?: string | null; pagada_hasta?: string | null;
  giro_cubre_rubro?: boolean | null;  // patente y carpeta: ¿el giro cubre el rubro que declaró el vendedor?
};

const s = (description: string) => ({ type: ["string", "null"], description });
const nro = (description: string) => ({ type: ["number", "null"], description });
const bool = (description: string) => ({ type: ["boolean", "null"], description });

const COMUNES = {
  tipo_documento: { type: "string", enum: ["ventas_sistema", "carpeta", "f29", "f22", "dicom", "tgr", "f30", "arriendo", "patente", "otro"], description: "Qué documento es en realidad, aunque el vendedor lo haya subido en otro lugar. carpeta = carpeta tributaria electrónica del SII; ventas_sistema = reporte o certificado de ventas de un sistema (Bsale, Toteat, Fudo, etc.); dicom = informe comercial Equifax/Dicom; tgr = certificado de deuda de la Tesorería; f30 = certificado de antecedentes laborales y previsionales de la Dirección del Trabajo." },
  legible: { type: "boolean", description: "true si se puede leer lo esencial del documento." },
  rut: s("RUT del titular (negocio o empresa), formato 12.345.678-9."),
  razon_social: s("Nombre o razón social del titular."),
  fecha_emision: s("Fecha de emisión o generación del documento, AAAA-MM-DD."),
  emisor: s("Quién emite el documento."),
  codigo_verificacion: s("Código de verificación, código de validación o clave que permite comprobar el documento en línea."),
  folio: s("Folio o número del documento."),
  url_verificacion: s("Dirección web impresa en el documento para verificarlo (si aparece)."),
  senales_alteracion: { type: "array", items: { type: "string" }, description: "Señales visibles de que el documento pudo ser modificado: tipografías o tamaños distintos en cifras, números desalineados, recuadros tapados, páginas cortadas o faltantes, fecha o RUT sobrescritos. Vacío si no hay." },
  confianza: { type: "number", minimum: 0, maximum: 1, description: "Qué tan seguro estás de la lectura completa (0 a 1)." },
  paginas: { type: "object", additionalProperties: { type: "integer" }, description: "Página (desde 1) donde leíste cada dato clave, por nombre de campo." },
  resumen: { type: "string", description: "Una frase en español simple con lo principal del documento." },
};

const POR_TIPO: Record<TipoDocCert, { instruccion: string; propiedades: Record<string, unknown> }> = {
  ventas_sistema: {
    instruccion: "Es un reporte o certificado de ventas de un sistema de punto de venta. Extrae la venta de cada mes de los últimos 12 meses (o los que aparezcan). Si el reporte muestra totales con IVA, ponlos en venta_bruta; si muestra montos netos (sin IVA), en venta_neta.",
    propiedades: {
      sistema: s("Nombre del sistema (Bsale, Toteat, Fudo, Jumpseller, otro)."),
      meses: { type: "array", items: { type: "object", properties: { periodo: { type: "string", description: "AAAA-MM" }, venta_neta: nro("Venta neta sin IVA"), venta_bruta: nro("Venta con IVA") }, required: ["periodo"] } },
    },
  },
  carpeta: {
    instruccion: "Es la carpeta tributaria electrónica del SII. De cada formulario 29 (F29) extrae el período y: ventas_netas (código 563 «base imponible» o ingresos brutos del mes; si no está, débito 538 ÷ 0,19 más ventas exentas 142 y 020), debito_iva (código 538), credito_iva (código 537) y compras_netas (537 ÷ 0,19). Marca sin_declaracion en los meses que digan que no hay declaración. Extrae también los F22 (año tributario, renta líquida imponible código 18 y ingresos brutos), giro, inicio de actividades y dirección.",
    propiedades: {
      f29: { type: "array", items: { type: "object", properties: { periodo: { type: "string" }, ventas_netas: nro("Ventas netas del mes"), debito_iva: nro("Código 538"), credito_iva: nro("Código 537"), compras_netas: nro("Compras netas"), sin_declaracion: { type: "boolean" } }, required: ["periodo"] } },
      f22: { type: "array", items: { type: "object", properties: { ano_tributario: { type: "integer" }, renta_liquida_imponible: nro("Renta líquida imponible"), ingresos_brutos: nro("Ingresos brutos del año") }, required: ["ano_tributario"] } },
      giro: s("Giro o actividad económica."), inicio_actividades: s("AAAA-MM-DD"), direccion: s("Domicilio registrado."),
    },
  },
  dicom: {
    instruccion: "Es un informe comercial (Dicom/Equifax). Extrae cada morosidad o deuda impaga informada (acreedor, tipo, monto y fecha), el total de morosidades en pesos y la cantidad de protestos. Si dice que no registra morosidades, deja la lista vacía y total en 0.",
    propiedades: {
      deudas_comerciales: { type: "array", items: { type: "object", properties: { acreedor: s("Acreedor"), tipo: s("Tipo de deuda"), monto: nro("Monto en pesos"), fecha: s("AAAA-MM-DD") } } },
      total_morosidad: nro("Total de morosidades en pesos."), protestos: nro("Cantidad de protestos."),
    },
  },
  tgr: {
    instruccion: "Es un certificado de deuda de la Tesorería General de la República. Indica si registra deuda fiscal y el monto total.",
    propiedades: { tiene_deuda_fiscal: bool("true si registra deuda fiscal."), monto_deuda_fiscal: nro("Monto total de deuda en pesos (0 si no tiene).") },
  },
  f30: {
    instruccion: "Es un certificado de antecedentes laborales y previsionales (F30) de la Dirección del Trabajo. Extrae el monto de multas impagas, la deuda previsional y si el certificado dice que no registra anotaciones.",
    propiedades: { multas_impagas: nro("Multas impagas en pesos."), deuda_previsional: nro("Deuda previsional en pesos."), trabajadores: nro("Trabajadores informados, si aparece."), sin_anotaciones: bool("true si no registra multas ni deudas.") },
  },
  arriendo: {
    instruccion: "Es un contrato de arriendo de un local comercial (con anexos). Extrae partes, dirección del local, fecha de inicio y de término (considera los anexos y renovaciones), plazo, si se renueva solo, la renta mensual (en pesos o UF), qué dice sobre ceder o subarrendar el contrato o transferir el negocio, si está firmado y si tiene firmas autorizadas ante notario.",
    propiedades: {
      arrendador: s("Nombre del arrendador."), arrendatario: s("Nombre del arrendatario."), rut_arrendatario: s("RUT del arrendatario."),
      direccion: s("Dirección del local arrendado."), fecha_inicio: s("AAAA-MM-DD"), fecha_termino: s("AAAA-MM-DD de término vigente."),
      plazo_meses: nro("Plazo en meses."), renovacion_automatica: bool("true si se renueva automáticamente."),
      renta_mensual: nro("Renta mensual en pesos (si está en UF, deja null y usa renta_uf)."), moneda: { type: ["string", "null"], enum: ["clp", "uf", null] }, renta_uf: nro("Renta mensual en UF."),
      cesion: { type: ["string", "null"], enum: ["si", "con_autorizacion", "no", "no_dice", null], description: "si = permite ceder; con_autorizacion = requiere autorización del arrendador; no = lo prohíbe." },
      notarial: bool("true si las firmas están autorizadas ante notario."), firmado: bool("true si se ven firmas de ambas partes."),
      termino_anticipado: bool("true si el arrendador puede poner término al contrato antes del plazo sin expresar causa (solo con aviso previo); false si no puede."),
      reajuste: s("Cómo se reajusta la renta (IPC, UF, porcentaje fijo, otro)."), garantia: nro("Monto de la garantía en pesos."),
    },
  },
  patente: {
    instruccion: "Es una patente municipal (o su comprobante de pago). Extrae el tipo (definitiva, provisoria, microempresa familiar MEF, alcoholes), giro, dirección, comuna, rol y hasta cuándo está pagada.",
    propiedades: {
      tipo_patente: { type: ["string", "null"], enum: ["definitiva", "provisoria", "mef", "alcoholes", "otra", null] },
      giro: s("Giro autorizado."), direccion: s("Dirección del local."), comuna: s("Comuna o municipalidad."), rol: s("Rol de la patente."), pagada_hasta: s("AAAA-MM-DD hasta donde está pagada."),
      giro_cubre_rubro: bool("true si el giro autorizado cubre el rubro que declaró el vendedor (se indica en las instrucciones); false si no lo cubre."),
    },
  },
};

export function esquemaDe(tipo: TipoDocCert, contexto: { rubro?: string } = {}) {
  const t = POR_TIPO[tipo];
  const rubro = contexto.rubro ? ` El vendedor declaró que el rubro del negocio es «${contexto.rubro.slice(0, 60)}».` : "";
  return {
    instruccion: `${t.instruccion}${rubro} Primero confirma qué documento es: si no corresponde a lo esperado, indícalo en tipo_documento y llena solo los campos comunes.`,
    esquema: {
      nombre: "registrar_lectura",
      descripcion: "Registra los datos leídos del documento.",
      propiedades: { ...COMUNES, ...t.propiedades },
      requeridos: ["tipo_documento", "legible", "confianza"],
    },
  };
}

// Tipos que deben ser el PDF original descargado del sitio oficial (no una foto ni un escaneo).
export const SOLO_PDF_ORIGINAL: TipoDocCert[] = ["carpeta", "dicom", "tgr", "f30"];
// Vigencia máxima desde la emisión.
export const DIAS_VIGENCIA: Partial<Record<TipoDocCert, number>> = { dicom: 30, tgr: 30, f30: 30, carpeta: 90 };
// Qué tipos detectados se aceptan para cada documento pedido (un F29 suelto no reemplaza la carpeta).
export const ACEPTA: Record<TipoDocCert, TipoDetectado[]> = {
  ventas_sistema: ["ventas_sistema"], carpeta: ["carpeta"], dicom: ["dicom"], tgr: ["tgr"], f30: ["f30"], arriendo: ["arriendo"], patente: ["patente"],
};
export const NOMBRE_DETECTADO: Record<TipoDetectado, string> = {
  ventas_sistema: "un reporte de ventas", carpeta: "la carpeta tributaria", f29: "un F29 suelto", f22: "un F22 (renta anual)", dicom: "un informe Dicom",
  tgr: "un certificado de la Tesorería", f30: "un certificado F30", arriendo: "un contrato de arriendo", patente: "una patente municipal", otro: "otro documento",
};
