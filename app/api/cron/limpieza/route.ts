import { NextResponse } from "next/server";
import { limpiezaDiaria } from "@/lib/limpieza";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Vercel la llama una vez al día: borra documentos según los plazos informados en el consentimiento.
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await limpiezaDiaria());
}
