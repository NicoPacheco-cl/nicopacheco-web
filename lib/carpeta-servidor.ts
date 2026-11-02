import "server-only";
import { BUCKET, cliente } from "./base-servidor";
import { leerCarpeta, resumen, type Lectura, type Periodo } from "./carpeta";
import type { DatosValorizacion } from "./valorizacion";

// Carpetas tributarias del SII (migración 0016). El PDF se guarda en el bucket privado «avisos» (carpetas/<id>.pdf).
// Se borran a los 90 días (lo mismo que dura la carpeta en el SII).

export const DIAS_CARPETA = 90;
export const MAX_MB_CARPETA = 4;
export type Carpeta = {
  id: string; token: string; creado_en: string; archivo: string | null; nombre_archivo: string | null; correo: string | null;
  rut: string | null; razon: string | null; estado: "leida" | "revision" | "verificada" | "rechazada";
  periodos: Periodo[]; ventas12: number; compras12: number; ventas_ant12: number | null; meses: number; ultimo: string | null;
  codigo_sii: string | null; clave_sii: string | null; nota: string | null; revisado_en: string | null;
};
const COLS = "id, token, creado_en, archivo, nombre_archivo, correo, rut, razon, estado, periodos, ventas12, compras12, ventas_ant12, meses, ultimo, codigo_sii, clave_sii, nota, revisado_en";
const uuid = (x: string) => /^[0-9a-f-]{36}$/.test(x);

// Texto del PDF con sus líneas: se agrupan los trozos por altura en la página (como se ve impreso).
async function textoPdf(buf: ArrayBuffer) {
  const { getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const paginas: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const pg = await pdf.getPage(i);
    const { items } = await pg.getTextContent();
    const trozos = (items as { str?: string; transform?: number[] }[])
      .filter((x) => typeof x.str === "string" && x.str.trim() && x.transform)
      .map((x) => ({ s: x.str!.trim(), x: x.transform![4], y: x.transform![5] }));
    trozos.sort((a, b) => b.y - a.y || a.x - b.x);
    const lineas: { y: number; t: { s: string; x: number }[] }[] = [];
    for (const t of trozos) {
      const l = lineas.find((z) => Math.abs(z.y - t.y) <= 2.5);
      if (l) l.t.push(t); else lineas.push({ y: t.y, t: [t] });
    }
    paginas.push(lineas.map((l) => l.t.sort((a, b) => a.x - b.x).map((t) => t.s).join("   ")).join("\n"));
  }
  return paginas.join("\n");
}

export async function subirCarpeta(archivo: File, extra: { correo?: string; codigo?: string; clave?: string }) {
  const sb = cliente();
  if (!sb) return { error: "No disponible por ahora." } as const;
  if (archivo.size > MAX_MB_CARPETA * 1024 * 1024) return { error: `El archivo pesa más de ${MAX_MB_CARPETA} MB.` } as const;
  const buf = await archivo.arrayBuffer();
  if (new TextDecoder().decode(buf.slice(0, 5)) !== "%PDF-") return { error: "Sube el PDF de la carpeta tributaria que entrega el SII." } as const;
  let l: Lectura;
  try { l = leerCarpeta(await textoPdf(buf)); }
  catch (e) { console.error("No se pudo leer el PDF de la carpeta", e); l = resumen([]); l.motivo = "No se pudo leer el texto del PDF."; }
  const { data, error } = await sb.from("carpetas_tributarias").insert({
    nombre_archivo: archivo.name.slice(0, 120), correo: extra.correo?.slice(0, 160) || null,
    rut: l.rut || null, razon: l.razon.slice(0, 120) || null, estado: l.ok ? "leida" : "revision",
    periodos: l.periodos.slice(0, 36), ventas12: l.ventas12, compras12: l.compras12, ventas_ant12: l.ventasAnt12, meses: l.meses, ultimo: l.ultimo || null,
    codigo_sii: extra.codigo?.slice(0, 60) || null, clave_sii: extra.clave?.slice(0, 60) || null,
    nota: l.ok ? (l.sinDeclaracion.length ? `La carpeta muestra ${l.sinDeclaracion.length} meses sin F29 declarado.` : null) : l.motivo ?? null,
  }).select(COLS).single();
  if (error || !data) {
    console.error("No se guardó la carpeta (¿falta la migración 0016?)", error?.message);
    return { error: "No pudimos guardar tu carpeta. Inténtalo de nuevo." } as const;
  }
  const path = `carpetas/${data.id}.pdf`;
  const { error: e2 } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: "application/pdf", upsert: true });
  if (!e2) await sb.from("carpetas_tributarias").update({ archivo: path }).eq("id", data.id);
  else console.error("No se subió el PDF de la carpeta", e2.message);
  return { ok: true, carpeta: data as unknown as Carpeta } as const;
}

export async function carpetaPorToken(token: string): Promise<Carpeta | null> {
  const sb = cliente();
  if (!sb || !uuid(token)) return null;
  const { data } = await sb.from("carpetas_tributarias").select(COLS).eq("token", token).maybeSingle();
  const c = (data as unknown as Carpeta) ?? null;
  if (c && Date.now() - new Date(c.creado_en).getTime() > DIAS_CARPETA * 864e5) { await borrarCarpeta(c); return null; }
  return c;
}

async function borrarCarpeta(c: Pick<Carpeta, "id" | "archivo">) {
  const sb = cliente();
  if (!sb) return;
  if (c.archivo) await sb.storage.from(BUCKET).remove([c.archivo]);
  await sb.from("carpetas_tributarias").delete().eq("id", c.id);
}

// Borra las carpetas vencidas (se llama al abrir /admin/inscritos).
export async function limpiarCarpetas() {
  const sb = cliente();
  if (!sb) return;
  const limite = new Date(Date.now() - DIAS_CARPETA * 864e5).toISOString();
  const { data } = await sb.from("carpetas_tributarias").select("id, archivo").lt("creado_en", limite).limit(200);
  for (const c of data ?? []) await borrarCarpeta(c as Carpeta);
}

// Lo que ve el navegador: solo el resumen (sin el archivo ni la clave del SII).
export const publico = (c: Carpeta) => ({
  token: c.token, estado: c.estado, ventas12: c.ventas12, compras12: c.compras12, ventasAnt12: c.ventas_ant12,
  meses: c.meses, ultimo: c.ultimo ?? "", razon: c.razon ?? "", rut: c.rut ?? "", nota: c.nota ?? "",
});

const CAMPOS_CARPETA = ["carpetaToken", "carpetaEstado", "carpetaVentas12", "carpetaCompras12", "carpetaVentasAnt12", "carpetaMeses", "carpetaUltimo", "carpetaRazon"] as const;

export function datosDeCarpeta(c: Carpeta | null): Partial<DatosValorizacion> {
  if (!c) return Object.fromEntries(CAMPOS_CARPETA.map((k) => [k, ""]));
  return {
    carpetaToken: c.token, carpetaEstado: c.estado, carpetaVentas12: String(c.ventas12 || ""), carpetaCompras12: String(c.compras12 || ""),
    carpetaVentasAnt12: c.ventas_ant12 ? String(c.ventas_ant12) : "", carpetaMeses: String(c.meses || ""), carpetaUltimo: c.ultimo ?? "",
    carpetaRazon: (c.razon ?? "").slice(0, 80),
  };
}

// En el servidor nunca se confía en las cifras de la carpeta que manda el navegador: se leen de la base de datos.
export async function conCarpeta(d: DatosValorizacion): Promise<DatosValorizacion> {
  const c = d.carpetaToken ? await carpetaPorToken(d.carpetaToken) : null;
  return { ...d, ...datosDeCarpeta(c) };
}

export async function periodosCarpeta(token: string) {
  return (await carpetaPorToken(token))?.periodos ?? [];
}
