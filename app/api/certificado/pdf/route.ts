import { certificadoPorToken, disponible } from "@/lib/certificados-servidor";
import { pdfCertificado } from "@/lib/certificado-pdf";
import { periodosCarpeta } from "@/lib/carpeta-servidor";

// Descarga el PDF del certificado (solo si está pagado o fue gratis durante el lanzamiento).
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const c = await certificadoPorToken(t);
  if (!c) return new Response("Certificado no encontrado.", { status: 404 });
  if (!disponible(c)) return new Response("Este certificado todavía no está pagado.", { status: 402 });
  const pdf = await pdfCertificado(c, { periodos: c.datos.carpetaToken ? await periodosCarpeta(c.datos.carpetaToken) : [] });
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-valorizacion-${c.folio}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
