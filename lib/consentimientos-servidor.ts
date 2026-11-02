import "server-only";
import { cliente } from "./base-servidor";
import { VERSION_CONSENTIMIENTO, type TipoConsentimiento } from "./consentimientos";

// Registra una aceptación. Si la tabla aún no existe, no rompe el flujo: lo anota en el log.
export async function registrarConsentimiento(req: Request | null, c: {
  tipo: TipoConsentimiento; correo?: string | null; referencia?: string | null; casillas: string[]; version?: string; firma?: string | null;
}) {
  const sb = cliente();
  if (!sb) return false;
  const h = req?.headers;
  const ip = (h?.get("x-forwarded-for")?.split(",")[0] ?? h?.get("x-real-ip") ?? "").trim().slice(0, 64) || null;
  const { error } = await sb.from("consentimientos").insert({
    tipo: c.tipo, correo: c.correo?.toLowerCase().slice(0, 160) || null, referencia: c.referencia?.slice(0, 80) || null,
    version: c.version ?? VERSION_CONSENTIMIENTO, casillas: c.casillas.slice(0, 20), firma: c.firma?.slice(0, 160) || null,
    ip, navegador: h?.get("user-agent")?.slice(0, 300) || null,
  });
  if (error) console.error("No se pudo registrar el consentimiento", error.message);
  return !error;
}
