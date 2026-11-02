import { NextResponse } from "next/server";
import { pagosActivos, sitio } from "@/lib/pagos-valoriza";
import { verificarPagoCertificado } from "@/lib/certificados-servidor";

// Aviso automático de Mercado Pago para certificados. No confiamos en el contenido: consultamos el pago.
export async function POST(req: Request) {
  if (!pagosActivos()) return NextResponse.json({ ok: true });
  const url = new URL(req.url);
  const b = await req.json().catch(() => ({}));
  const tipo = b?.type || b?.topic || url.searchParams.get("type") || url.searchParams.get("topic");
  const id = String(b?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  if (tipo !== "payment" || !/^\d+$/.test(id)) return NextResponse.json({ ok: true });
  await verificarPagoCertificado(id, sitio(req));
  return NextResponse.json({ ok: true });
}
