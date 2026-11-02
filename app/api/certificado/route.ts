import { registrarConsentimiento } from "@/lib/consentimientos-servidor";
import { NextResponse } from "next/server";
import { sitio } from "@/lib/pagos-valoriza";
import { crearCertificado, limpiarDatos } from "@/lib/certificados-servidor";
import { conCarpeta } from "@/lib/carpeta-servidor";
import { esPlan } from "@/lib/certificado";

const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Pide un certificado de valorización: con cobro activo devuelve el enlace de Mercado Pago;
// sin cobro (lanzamiento) devuelve directo el enlace del certificado.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  if (txt(b.sitio_web, 100)) return NextResponse.json({ ok: true }); // trampa para robots
  const nombre = txt(b.nombre, 120);
  const correo = txt(b.correo, 160).toLowerCase();
  const negocio = txt(b.negocio, 120);
  if (nombre.length < 2) return NextResponse.json({ error: "Escribe tu nombre." }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) return NextResponse.json({ error: "Revisa tu correo." }, { status: 422 });
  if (negocio.length < 2) return NextResponse.json({ error: "Escribe el nombre del negocio." }, { status: 422 });
  if (b.acepta !== true) return NextResponse.json({ error: "Debes aceptar el uso de tus datos para emitir el certificado." }, { status: 422 });
  const codigo = txt(b.codigo, 40) || undefined;
  const r = await crearCertificado({ nombre, correo, negocio, datos: await conCarpeta(limpiarDatos(b.datos)), plan: esPlan(b.plan) ? b.plan : "standard" }, sitio(req), codigo);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 422 });
  await registrarConsentimiento(req, { tipo: "certificado", correo, casillas: ["datos"] });
  return NextResponse.json({ ok: true, url: r.url });
}
