import { CASILLAS_CERT_DOCS, casillasAceptadas } from "@/lib/consentimientos";
import { registrarConsentimiento } from "@/lib/consentimientos-servidor";
import { after, NextResponse } from "next/server";
import { procesarCertificado } from "@/lib/lectura-servidor";
import { sitio } from "@/lib/pagos-valoriza";
import { certificadoPorToken, disponible, enviarARevision } from "@/lib/certificados-servidor";

export const maxDuration = 300;

// El cliente envía sus documentos a revisión (Gold y Platinum). Después de responder, la IA los lee, los contrasta
// con lo declarado y decide (lib/lectura-servidor.ts); si algo falla, el cron lo reintenta.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const c = await certificadoPorToken(typeof b?.token === "string" ? b.token : "");
  if (!c || !disponible(c)) return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });
  const cs = casillasAceptadas(CASILLAS_CERT_DOCS, b?.casillas);
  if (!cs.ok) return NextResponse.json({ error: `Falta aceptar: ${cs.faltan.join(", ")}.` }, { status: 422 });
  const r = await enviarARevision(c, sitio(req));
  if (!("error" in r)) await registrarConsentimiento(req, { tipo: "certificado_docs", correo: c.correo, referencia: c.id, casillas: cs.claves });
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 422 });
  const base = sitio(req);
  after(() => procesarCertificado(c.id, base).catch((e) => console.error("Lectura IA", e)));
  return NextResponse.json({ ok: true });
}
