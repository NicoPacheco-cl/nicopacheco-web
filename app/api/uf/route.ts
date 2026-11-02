import { NextResponse } from "next/server";

// Valor de la UF del día (mindicador.cl, datos del Banco Central). Respuestas buenas en caché 12 horas;
// si el servicio no responde, devuelve un valor de respaldo sin cachearlo y el usuario lo ve marcado como aproximado.
export const dynamic = "force-dynamic";
const RESPALDO = 40000;

async function leer(url: string) {
  const r = await fetch(url, { next: { revalidate: 43200 }, signal: AbortSignal.timeout(6000), headers: { "User-Agent": "NicoPacheco/1.0 (+https://nicopacheco.cl)" } });
  if (!r.ok) throw new Error(String(r.status));
  const j = await r.json();
  // mindicador.cl: { serie: [{ valor, fecha }] } · boostr.cl: { data: { value, date } }
  const s = j?.serie?.[0] ?? (j?.data?.value ? { valor: j.data.value, fecha: j.data.date } : null);
  if (!(s && Number(s.valor) > 10000)) throw new Error("sin valor");
  return { valor: Math.round(Number(s.valor) * 100) / 100, fecha: String(s.fecha) };
}

export async function GET() {
  for (const url of ["https://mindicador.cl/api/uf", "https://api.boostr.cl/economy/indicator/uf.json"]) {
    try {
      const x = await leer(url);
      return NextResponse.json({ ...x, fuente: new URL(url).hostname }, { headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400" } });
    } catch (e) {
      console.error("UF no disponible desde", url, (e as Error).message);
    }
  }
  return NextResponse.json({ valor: RESPALDO, fecha: null, fuente: "respaldo" }, { headers: { "Cache-Control": "no-store" } });
}
