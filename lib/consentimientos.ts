// Consentimientos de la valorización (Ley 19.628 y Ley 21.719). Textos sujetos a revisión de un abogado.
// Una casilla por finalidad, ninguna marcada de antemano y registro de cada aceptación con su versión.
export const VERSION_CONSENTIMIENTO = "np1-2026-11-01";
export const PLAZO_BORRADO_DIAS = 90;

export type Casilla = { clave: string; titulo: string; texto: string; obligatoria: boolean };
export type TipoConsentimiento = "certificado" | "certificado_docs" | "carpeta";

export const CASILLAS_CERT_DOCS: Casilla[] = [
  { clave: "verificar", titulo: "Uso de los documentos", obligatoria: true,
    texto: `Autorizo a Nico Pacheco a revisar estos documentos solo para verificar mi valorización, con apoyo, cuando corresponda, de una herramienta de lectura automática (Anthropic, que no los usa para entrenar sus modelos). Se borran ${PLAZO_BORRADO_DIAS} días después de emitido el certificado; el certificado solo indica qué documentos se verificaron.` },
  { clave: "terceros", titulo: "Datos de terceros", obligatoria: true,
    texto: "Los documentos son míos o de la empresa que represento; tapé los datos de otras personas que no sean necesarios para verificar." },
];

export function casillasAceptadas(lista: Casilla[], recibidas: unknown): { ok: boolean; claves: string[]; faltan: string[] } {
  const r = new Set(Array.isArray(recibidas) ? recibidas.filter((x): x is string => typeof x === "string") : []);
  const claves = lista.filter((c) => r.has(c.clave)).map((c) => c.clave);
  const faltan = lista.filter((c) => c.obligatoria && !r.has(c.clave)).map((c) => c.titulo);
  return { ok: faltan.length === 0, claves, faltan };
}
