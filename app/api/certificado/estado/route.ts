import { NextResponse } from "next/server";
import { certificadoPorToken, disponible } from "@/lib/certificados-servidor";

// El valorizador pregunta si su certificado ya está pagado, para mostrar el detalle del valor.
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const c = await certificadoPorToken(t);
  if (!c) return NextResponse.json({ disponible: false }, { status: 404 });
  return NextResponse.json({ disponible: disponible(c), datos: disponible(c) ? c.datos : null });
}
