import { NextResponse } from "next/server";
import { sitio } from "@/lib/pagos-valoriza";
import { esPlan } from "@/lib/certificado";
import { certificadoPorToken, mejorarCertificado } from "@/lib/certificados-servidor";

// Sube un certificado a Gold o Platinum pagando solo la diferencia.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const c = await certificadoPorToken(typeof b?.token === "string" ? b.token : "");
  if (!c) return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });
  if (!esPlan(b.plan)) return NextResponse.json({ error: "Plan no válido." }, { status: 400 });
  const r = await mejorarCertificado(c, b.plan, sitio(req));
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 422 });
  return NextResponse.json({ ok: true, url: r.url });
}
