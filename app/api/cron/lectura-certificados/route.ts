import { NextResponse } from "next/server";
import { sitio } from "@/lib/pagos-valoriza";
import { procesarPendientes } from "@/lib/lectura-servidor";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Vercel lo llama una vez al día (vercel.json; el plan Hobby no permite más). Además se reintenta al abrir
// la página del certificado o /admin/inscritos: lee los certificados en revisión que quedaron sin leer o con error.
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await procesarPendientes(sitio(req)));
}
