import { pdfCertificado } from "@/lib/certificado-pdf";
import { certificadoEjemplo } from "@/lib/certificado-ejemplo";
import { esPlan, type PlanCert } from "@/lib/certificado";

// PDF de ejemplo del certificado (datos ficticios, marca de agua «EJEMPLO»), para mostrar antes de pagar.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("plan");
  const plan: PlanCert = esPlan(q) ? q : "standard";
  const pdf = await pdfCertificado(certificadoEjemplo(plan), { ejemplo: true });
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ejemplo-valorizacion-${plan}.pdf"`,
      "Cache-Control": "no-store", // siempre la versión vigente del formato
    },
  });
}
