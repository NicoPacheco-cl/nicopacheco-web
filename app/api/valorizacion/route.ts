import { NextResponse } from "next/server";
import { cliente } from "@/lib/base-servidor";
import { VALORIZACION_VACIA, valorizar, ventaBruta, type DatosValorizacion } from "@/lib/valorizacion";

// Guarda una valorización (anónima) para estadísticas del mercado.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  const d = { ...VALORIZACION_VACIA } as unknown as Record<string, string>;
  for (const k of Object.keys(VALORIZACION_VACIA)) {
    const v = (b as Record<string, unknown>)[k];
    if (typeof v === "string") d[k] = v.slice(0, 120);
  }
  const datos = d as unknown as DatosValorizacion;
  const r = valorizar(datos);
  if (!r.listo) return NextResponse.json({ error: "Faltan ventas, utilidad o meses de contrato." }, { status: 422 });
  const sb = cliente();
  if (!sb) return NextResponse.json({ ok: true, guardado: false });
  const { error } = await sb.from("valorizaciones").insert({
    rubro: datos.rubro || null,
    region: datos.region || null,
    comuna: datos.comuna || null,
    venta_mensual: Math.round(ventaBruta(datos)) || null, // siempre bruta, para comparar con las anteriores
    utilidad_mensual: Number(datos.utilidadMensual) || null,
    valor: Math.round(r.valor),
    datos: { ...datos, resultado: { version: 4, puntaje: r.puntaje, factor: Math.round(r.factor * 1000) / 1000, base: Math.round(r.base), topeContrato: Math.round(r.topeContrato), valor: Math.round(r.valor), dimensiones: Object.fromEntries(r.dimensiones.map((x) => [x.id, Math.round(x.puntos * 10) / 10])) } },
  });
  if (error) console.error("No se guardó la valorización", error.message);
  return NextResponse.json({ ok: true, guardado: !error });
}
