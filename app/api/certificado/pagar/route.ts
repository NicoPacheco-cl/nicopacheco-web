import { NextResponse } from "next/server";
import { sitio } from "@/lib/pagos-valoriza";
import { certificadoPorToken, pagarCertificado } from "@/lib/certificados-servidor";

// Reintenta el pago de un certificado pendiente desde su enlace privado.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const c = await certificadoPorToken(typeof b?.token === "string" ? b.token : "");
  if (!c) return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });
  if (c.estado !== "pendiente") return NextResponse.json({ error: "Este certificado ya está pagado." }, { status: 409 });
  const r = await pagarCertificado(c, sitio(req));
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 422 });
  return NextResponse.json({ ok: true, url: r.url });
}
