import { NextResponse } from "next/server";
import { BUCKET, cliente } from "@/lib/base-servidor";
import { periodosDesdeTexto, resumen } from "@/lib/carpeta";
import { DOCS_CERT, PLANES_CERT, type TipoDocCert } from "@/lib/certificado";
import { analisisDe, certificadoPorId, planDe, resolverRevision, urlDocumento, type VerificacionCert } from "@/lib/certificados-servidor";
import { iaActiva } from "@/lib/ia";
import { lecturaDe, procesarCertificado } from "@/lib/lectura-servidor";
import { sitio } from "@/lib/pagos-valoriza";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMIN = "nikolaspacheco@gmail.com";
const UUID = /^[0-9a-f-]{36}$/;

// Solo la sesión del dueño en /admin puede usar esta ruta: la base contiene documentos y datos de clientes.
async function esAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const sb = cliente();
  if (!token || !sb) return false;
  const { data } = await sb.auth.getUser(token);
  return data.user?.email?.toLowerCase() === ADMIN;
}
const noAutorizado = () => NextResponse.json({ error: "No autorizado" }, { status: 401 });

export async function GET(req: Request) {
  if (!(await esAdmin(req))) return noAutorizado();
  const sb = cliente()!;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (id) {
    const c = await certificadoPorId(id);
    if (!c) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    const plan = planDe(c);
    const a = analisisDe(c);
    const conPrima = analisisDe({ ...c, revision: "verificado", revisado_en: new Date().toISOString() });
    const documentos = await Promise.all(PLANES_CERT[plan].docs.map(async (t: TipoDocCert) => ({
      tipo: t, titulo: DOCS_CERT[t].t, item: c.verificacion?.items?.[t] ?? null,
      archivos: await Promise.all((c.documentos?.[t]?.archivos ?? []).map(async (x) => ({ nombre: x.nombre, url: await urlDocumento(x.path) }))),
    })));
    return NextResponse.json({
      certificado: c, planNombre: PLANES_CERT[plan].nombre, prima: PLANES_CERT[plan].prima, documentos, ia: iaActiva(),
      lectura: plan === "standard" ? null : await lecturaDe(c.id),
      valor: Math.round(a.valor), valorVerificado: Math.round(conPrima.valor), puntaje: a.r.puntaje,
      utilidadNormalizada: Math.round(a.r.utilidadNormalizada), totalDeudas: Math.round(a.r.totalDeudas),
    });
  }
  const [certs, carpetas] = await Promise.all([
    sb.from("certificados_valorizacion").select("id, folio, token, creado_en, nombre, correo, negocio, valor, monto, estado, plan, revision, lectura").order("creado_en", { ascending: false }).limit(300),
    sb.from("carpetas_tributarias").select("id, creado_en, archivo, nombre_archivo, rut, razon, estado, periodos, ventas12, compras12, meses, ultimo, codigo_sii, clave_sii, nota").order("creado_en", { ascending: false }).limit(200),
  ]);
  const lista = carpetas.data ?? [];
  const firmadas = await Promise.all(lista.map(async (x) => (x.archivo ? (await sb.storage.from(BUCKET).createSignedUrl(x.archivo as string, 3600)).data?.signedUrl ?? null : null)));
  return NextResponse.json({
    certificados: certs.data ?? [],
    carpetas: lista.map((x, i) => ({ ...x, url: firmadas[i] })),
    error: certs.error?.message ?? carpetas.error?.message ?? null,
  });
}

export async function POST(req: Request) {
  if (!(await esAdmin(req))) return noAutorizado();
  const b = await req.json().catch(() => null);
  if (!b || !UUID.test(String(b.id ?? ""))) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  if (b.accion === "revisar") {
    if (b.decision !== "verificar" && b.decision !== "corregir" && b.decision !== "standard") return NextResponse.json({ error: "Decisión inválida." }, { status: 400 });
    const c = await certificadoPorId(b.id);
    if (!c) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    const items: VerificacionCert["items"] = {};
    for (const t of PLANES_CERT[planDe(c)].docs as TipoDocCert[]) {
      const x = b.items?.[t];
      items[t] = { ok: x?.ok !== false, nota: typeof x?.nota === "string" ? x.nota.trim().slice(0, 300) || undefined : undefined };
    }
    const num = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(0, 12);
    const correcciones = { ...(c.verificacion?.correcciones ?? {}) };
    for (const k of ["ventaNeta", "utilidadMensual"] as const) { const v = num(b[k]); if (v) correcciones[k] = v; else delete correcciones[k]; }
    const r = await resolverRevision(b.id, b.decision, { nota: String(b.nota ?? "").trim(), verificacion: { items, correcciones } }, sitio(req));
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 422 });
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "releer") {
    await procesarCertificado(b.id, sitio(req), { forzar: true, manual: true });
    return NextResponse.json({ ok: true });
  }
  if (b.accion === "carpeta") {
    if (!["leida", "revision", "verificada", "rechazada"].includes(b.estado)) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    const sb = cliente()!;
    const ps = periodosDesdeTexto(String(b.periodos ?? ""));
    const r = resumen(ps);
    const cambios: Record<string, unknown> = { estado: b.estado, nota: String(b.nota ?? "").slice(0, 500) || null, revisado_en: new Date().toISOString() };
    if (ps.length) Object.assign(cambios, { periodos: r.periodos, ventas12: r.ventas12, compras12: r.compras12, ventas_ant12: r.ventasAnt12, meses: r.meses, ultimo: r.ultimo || null });
    if ((b.estado === "leida" || b.estado === "verificada") && !ps.length) {
      const { data } = await sb.from("carpetas_tributarias").select("meses").eq("id", b.id).maybeSingle();
      if (!data?.meses) return NextResponse.json({ error: "Para marcarla como leída o verificada, ingresa las cifras de cada mes." }, { status: 422 });
    }
    const { error } = await sb.from("carpetas_tributarias").update(cambios).eq("id", b.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
}
