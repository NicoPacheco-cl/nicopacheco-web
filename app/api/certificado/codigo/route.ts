import { esPlan, PLANES_CERT } from "@/lib/certificado";
import { evaluarCodigo } from "@/lib/servidor";

export const dynamic = "force-dynamic";

// Revisa un código de descuento para un certificado. Responde como /api/codigo, para usar el mismo campo.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const plan = u.searchParams.get("producto");
  if (!esPlan(plan)) return Response.json({ valido: false, mensaje: "Certificado no válido." });
  return Response.json(await evaluarCodigo(u.searchParams.get("codigo"), { id: "valorizacion-pyme", tipo: "servicio", padre: null }, PLANES_CERT[plan].lista));
}
