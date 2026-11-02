import "server-only";
import type { TipoDocCert } from "./certificado";
import type { Autenticidad } from "./contraste";
import type { Extraccion } from "./lectura-esquemas";

// Autenticidad de los documentos, sin intervención del dueño (16 oct 2026). Tres capas:
// 1. Revisión técnica del archivo PDF: qué programa lo generó, si fue modificado después de emitido, si trae firma.
// 2. Coherencia (en lib/contraste.ts): mismo RUT en todos los certificados, dígito verificador, sistema de ventas
//    contra el SII mes a mes y fechas. Falsificar dos fuentes independientes que calcen es muy difícil.
// 3. Verificación en línea del código impreso: si el documento trae una dirección web de un sitio oficial con su
//    folio o código, el servidor la abre y busca el folio o el RUT en la respuesta. Se activa con
//    VERIFICACION_EN_LINEA=1 una vez probada con documentos reales (cada sitio tiene su formato y algunos piden
//    CAPTCHA: en ese caso no se fuerza, queda «no disponible» y deciden las otras dos capas).

// Programas de edición: un certificado oficial no sale de ellos.
const EDITORES = [/photoshop/i, /illustrator/i, /canva/i, /ilovepdf/i, /smallpdf/i, /sejda/i, /pdfescape/i, /pdf-?xchange/i, /foxit phantom/i, /nitro/i, /inkscape/i, /gimp/i, /libreoffice/i, /microsoft.*word/i, /pages/i, /pdfelement/i, /pdf candy/i];

function campo(texto: string, nombre: string) {
  const m = new RegExp(`/${nombre}\\s*\\(([^)]{0,200})\\)`).exec(texto);
  return m?.[1]?.replace(/\\(.)/g, "$1") ?? "";
}

export function revisarArchivo(bytes: Uint8Array, mime: string, tipo: TipoDocCert): Omit<Autenticidad, "enLinea"> {
  if (mime !== "application/pdf") return { formato: mime.startsWith("image/") ? "imagen" : "otro", senalesArchivo: [] };
  const texto = new TextDecoder("latin1").decode(bytes);
  const senales: string[] = [];
  const productor = `${campo(texto, "Producer")} ${campo(texto, "Creator")}`.trim();
  const firmado = /\/ByteRange\s*\[/.test(texto) && /\/Sig\b/.test(texto);
  const linealizado = /\/Linearized/.test(texto.slice(0, 2048));
  const eofs = (texto.match(/%%EOF/g) ?? []).length;
  const oficial = tipo === "carpeta" || tipo === "dicom" || tipo === "tgr" || tipo === "f30";
  if (oficial && EDITORES.some((r) => r.test(productor))) senales.push(`el PDF fue generado o guardado con un programa de edición (${productor.slice(0, 80)})`);
  if (oficial && !firmado && eofs > (linealizado ? 2 : 1)) senales.push("el PDF tiene cambios guardados después de su creación");
  const creado = campo(texto, "CreationDate"), modificado = campo(texto, "ModDate");
  if (oficial && creado && modificado && modificado.slice(2, 16) > creado.slice(2, 16) && !firmado) {
    // Una diferencia de minutos es normal al generarlo; se marca si se modificó otro día.
    if (modificado.slice(2, 10) !== creado.slice(2, 10)) senales.push(`fecha de modificación (${modificado.slice(2, 10)}) distinta de la de creación (${creado.slice(2, 10)})`);
  }
  if (/\/JavaScript|\/JS\s*\(/.test(texto)) senales.push("el PDF contiene código");
  return { formato: "pdf", senalesArchivo: senales, firmado };
}

// Dominios oficiales en los que se puede comprobar un documento.
const OFICIALES: Partial<Record<TipoDocCert, string[]>> = {
  carpeta: ["sii.cl"], tgr: ["tgr.cl", "tgr.gob.cl"], f30: ["dt.gob.cl", "direcciondeltrabajo.cl"], dicom: ["equifax.cl"],
};
const oficial = (host: string, tipo: TipoDocCert) => (OFICIALES[tipo] ?? []).some((d) => host === d || host.endsWith(`.${d}`));

export async function verificarEnLinea(tipo: TipoDocCert, x: Extraccion | null): Promise<Pick<Autenticidad, "enLinea" | "enLineaDetalle">> {
  if (!OFICIALES[tipo]) return { enLinea: "no_aplica" };
  if (process.env.VERIFICACION_EN_LINEA !== "1" || !x?.url_verificacion) return { enLinea: "no_disponible" };
  let url: URL;
  try { url = new URL(x.url_verificacion.trim()); } catch { return { enLinea: "no_disponible", enLineaDetalle: "La dirección impresa no es válida." }; }
  if (url.protocol !== "https:" || !oficial(url.hostname, tipo)) return { enLinea: "no_disponible", enLineaDetalle: `La dirección no es de un sitio oficial (${url.hostname}).` };
  const buscar = [x.folio, x.codigo_verificacion, x.rut?.replace(/[^0-9kK]/g, "").slice(0, -1)].filter((v): v is string => Boolean(v && v.replace(/\W/g, "").length >= 5));
  if (!buscar.length) return { enLinea: "no_disponible", enLineaDetalle: "El documento no trae folio ni código legible." };
  try {
    // Solo se siguen redirecciones dentro de sitios oficiales.
    let actual = url;
    for (let saltos = 0; saltos < 4; saltos++) {
      const r = await fetch(actual, { redirect: "manual", signal: AbortSignal.timeout(15_000), headers: { "user-agent": "NicoPacheco-verificacion/1.0 (+https://nicopacheco.cl)" } });
      if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
        const sig = new URL(r.headers.get("location")!, actual);
        if (sig.protocol !== "https:" || !oficial(sig.hostname, tipo)) return { enLinea: "no_disponible", enLineaDetalle: "El sitio redirige fuera del dominio oficial." };
        actual = sig; continue;
      }
      if (!r.ok) return { enLinea: "no_disponible", enLineaDetalle: `El sitio respondió ${r.status}.` };
      const cuerpo = (await r.text()).slice(0, 400_000);
      if (/captcha/i.test(cuerpo)) return { enLinea: "no_disponible", enLineaDetalle: "El sitio pide CAPTCHA: se usa la revisión del archivo y la coherencia." };
      const plano = cuerpo.replace(/[.\s-]/g, "");
      const hallado = buscar.find((b) => plano.includes(b.replace(/[.\s-]/g, "")));
      return hallado ? { enLinea: "verificado", enLineaDetalle: `${actual.hostname} confirma ${hallado === x.folio ? "el folio" : hallado === x.codigo_verificacion ? "el código" : "el RUT"}.` }
        : { enLinea: "no_coincide", enLineaDetalle: `${actual.hostname} no muestra el folio ni el código del documento.` };
    }
    return { enLinea: "no_disponible", enLineaDetalle: "Demasiadas redirecciones." };
  } catch (e) {
    return { enLinea: "no_disponible", enLineaDetalle: `No se pudo abrir el sitio oficial (${(e as Error).name}).` };
  }
}
