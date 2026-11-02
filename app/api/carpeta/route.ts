import { registrarConsentimiento } from "@/lib/consentimientos-servidor";
import { NextResponse } from "next/server";
import { carpetaPorToken, publico, subirCarpeta } from "@/lib/carpeta-servidor";

// Sube la carpeta tributaria del SII (PDF) y devuelve el resumen leído; GET ?t= consulta su estado.
export async function POST(req: Request) {
  const f = await req.formData().catch(() => null);
  const archivo = f?.get("archivo");
  if (!(archivo instanceof File)) return NextResponse.json({ error: "Elige el PDF de tu carpeta tributaria." }, { status: 422 });
  if (f?.get("acepta") !== "si") return NextResponse.json({ error: "Debes autorizar el uso de la carpeta para verificar tus ventas." }, { status: 422 });
  const txt = (k: string) => (typeof f?.get(k) === "string" ? String(f!.get(k)).trim() : "");
  const r = await subirCarpeta(archivo, { correo: txt("correo"), codigo: txt("codigo"), clave: txt("clave") });
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 422 });
  await registrarConsentimiento(req, { tipo: "carpeta", correo: txt("correo") || null, referencia: r.carpeta.token, casillas: ["verificar_ventas"] });
  return NextResponse.json({ ok: true, carpeta: publico(r.carpeta) });
}

export async function GET(req: Request) {
  const c = await carpetaPorToken(new URL(req.url).searchParams.get("t") ?? "");
  if (!c) return NextResponse.json({ error: "No encontramos la carpeta (puede haber vencido)." }, { status: 404 });
  return NextResponse.json({ ok: true, carpeta: publico(c) });
}
