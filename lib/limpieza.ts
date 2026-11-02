import "server-only";
import { BUCKET, cliente } from "./base-servidor";
import { limpiarCarpetas } from "./carpeta-servidor";
import { PLAZO_BORRADO_DIAS } from "./consentimientos";

// Borrado automático de archivos según los plazos del consentimiento (Ley 21.719: conservar solo lo necesario).
//  - Carpetas tributarias: 90 días después de subidas.
//  - Documentos de valorizaciones Gold y Platinum: 90 días después de la revisión.
export async function limpiezaDiaria() {
  const sb = cliente();
  if (!sb) return { error: "Sin base de datos" };
  const limite = new Date(Date.now() - PLAZO_BORRADO_DIAS * 864e5).toISOString();
  const r = { certificados: 0, archivos: 0 };
  await limpiarCarpetas().catch(() => {});
  const { data: certs } = await sb.from("certificados_valorizacion").select("id, documentos")
    .in("revision", ["verificado", "rechazado"]).lt("revisado_en", limite).is("documentos_borrados_en", null).limit(100);
  for (const c of certs ?? []) {
    const lista: string[] = [];
    for (const v of Object.values((c.documentos ?? {}) as Record<string, { archivos?: { path: string }[] }>))
      for (const x of v?.archivos ?? []) if (x.path?.startsWith(`certificados/${c.id}/`)) lista.push(x.path);
    if (lista.length) await sb.storage.from(BUCKET).remove(lista);
    await sb.from("certificados_valorizacion").update({ documentos_borrados_en: new Date().toISOString() }).eq("id", c.id);
    r.certificados++; r.archivos += lista.length;
  }
  return r;
}
