import { after, NextResponse } from "next/server";
import { leerAlSubir } from "@/lib/lectura-servidor";
import { DOCS_CERT, type TipoDocCert } from "@/lib/certificado";
import { agregarCarpeta, certificadoPorToken, disponible, firmarSubidaDoc, quitarDocumento, registrarDocumento } from "@/lib/certificados-servidor";

export const maxDuration = 300;

// Documentos de las valorizaciones Gold y Platinum, desde el enlace privado del certificado.
// accion: firmar (URL de subida directa a Storage) · registrar (guarda el archivo ya subido) · quitar · carpeta.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const c = await certificadoPorToken(typeof b?.token === "string" ? b.token : "");
  if (!c || !disponible(c)) return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });
  const tipo = String(b.tipo ?? "") as TipoDocCert;
  if (b.accion !== "carpeta" && !(tipo in DOCS_CERT)) return NextResponse.json({ error: "Documento desconocido." }, { status: 400 });
  const txt = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const r =
    b.accion === "firmar" ? await firmarSubidaDoc(c, tipo, txt(b.mime, 60), Number(b.tamano))
    : b.accion === "registrar" ? await registrarDocumento(c, tipo, txt(b.path, 200), txt(b.nombre, 160))
    : b.accion === "quitar" ? await quitarDocumento(c, tipo, txt(b.path, 200))
    : b.accion === "carpeta" ? await agregarCarpeta(c, txt(b.carpetaToken, 40))
    : { error: "Acción no válida." };
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 422 });
  // Cada archivo nuevo se lee de inmediato para avisarle al vendedor si sirve (aviso en su página).
  if (b.accion === "registrar" || b.accion === "carpeta") after(() => leerAlSubir(c.id).catch((e) => console.error("Lectura IA al subir", e)));
  return NextResponse.json(r);
}
