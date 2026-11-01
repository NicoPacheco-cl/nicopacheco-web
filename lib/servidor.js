// Utilidades que solo corren en el servidor (nunca llegan al navegador).

export const LIBRO = {
  titulo: 'Franquicia Justa',
  precios: { fisico: 14990, digital: 7990 },
};

export const ESTADOS_MP = {
  approved: 'pagado',
  authorized: 'en_proceso',
  in_process: 'en_proceso',
  in_mediation: 'en_proceso',
  pending: 'pendiente',
  rejected: 'rechazado',
  cancelled: 'cancelado',
  refunded: 'reembolsado',
  charged_back: 'reembolsado',
};

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !clave) return null;
  const headers = { apikey: clave, 'Content-Type': 'application/json' };
  // Las claves antiguas (JWT) también van en Authorization; las nuevas sb_secret_ solo en apikey.
  if (clave.startsWith('eyJ')) headers.Authorization = `Bearer ${clave}`;
  return { url, headers };
}

export async function crearPedido(datos) {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const r = await fetch(`${cfg.url}/rest/v1/pedidos_libro`, {
    method: 'POST',
    headers: { ...cfg.headers, Prefer: 'return=representation' },
    body: JSON.stringify(datos),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const [fila] = await r.json();
  return fila;
}

export async function actualizarPedido(id, cambios) {
  const cfg = supabaseConfig();
  if (!cfg || !id) return;
  const r = await fetch(`${cfg.url}/rest/v1/pedidos_libro?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: cfg.headers,
    body: JSON.stringify({ ...cambios, actualizado_en: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
}

export async function mercadoPago(ruta, opciones = {}) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('Falta MP_ACCESS_TOKEN');
  const r = await fetch(`https://api.mercadopago.com${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opciones.headers || {}),
    },
  });
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Mercado Pago ${r.status}: ${JSON.stringify(cuerpo).slice(0, 300)}`);
  return cuerpo;
}

export function origenSitio(request) {
  if (process.env.SITIO_URL) return process.env.SITIO_URL.replace(/\/$/, '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

// ---------- Libro digital: descarga automática ----------

const BUCKET = 'libro-digital';

const ETIQUETAS = {
  pdf: 'Descargar PDF',
  epub: 'Descargar EPUB (Kindle y Apple Books)',
  mobi: 'Descargar para Kindle (MOBI)',
  azw3: 'Descargar para Kindle (AZW3)',
  kfx: 'Descargar para Kindle (KFX)',
};

export async function obtenerPedido(id) {
  const cfg = supabaseConfig();
  if (!cfg || !/^[0-9a-f-]{36}$/i.test(id || '')) return null;
  const r = await fetch(`${cfg.url}/rest/v1/pedidos_libro?id=eq.${id}&select=id,formato,estado,nombre,correo,total`, {
    headers: cfg.headers,
    cache: 'no-store',
  });
  if (!r.ok) return null;
  const [fila] = await r.json();
  return fila ?? null;
}

// Confirma con Mercado Pago si el pedido tiene un pago aprobado (por si el aviso automático aún no llega).
export async function confirmarPagoAprobado(pedidoId) {
  try {
    const res = await mercadoPago(
      `/v1/payments/search?external_reference=${encodeURIComponent(pedidoId)}&status=approved&limit=1`
    );
    const pago = res.results?.[0];
    if (!pago) return false;
    await actualizarPedido(pedidoId, {
      estado: 'pagado',
      mp_pago_id: String(pago.id),
      mp_estado_detalle: pago.status_detail ?? null,
    });
    return true;
  } catch (e) {
    console.error('[confirmarPagoAprobado]', e);
    return false;
  }
}

// Lista los archivos del libro y entrega enlaces firmados que vencen en 1 hora.
export async function enlacesDeDescarga() {
  const cfg = supabaseConfig();
  if (!cfg) return [];
  const lista = await fetch(`${cfg.url}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: cfg.headers,
    body: JSON.stringify({ prefix: '', limit: 20, sortBy: { column: 'name', order: 'asc' } }),
    cache: 'no-store',
  });
  if (!lista.ok) return [];
  // Se entrega un archivo por formato. Se ignoran los de imprenta (KDP, interior) y los ocultos.
  const porFormato = new Map();
  for (const a of await lista.json()) {
    if (!a.id || a.name.startsWith('.') || /kdp|interior/i.test(a.name)) continue;
    const ext = a.name.split('.').pop().toLowerCase();
    if (!ETIQUETAS[ext]) continue;
    const previo = porFormato.get(ext);
    if (!previo || new Date(a.updated_at || a.created_at) > new Date(previo.updated_at || previo.created_at)) porFormato.set(ext, a);
  }
  const orden = ['pdf', 'epub', 'mobi', 'azw3', 'kfx'];
  const archivos = [...porFormato.entries()].sort((x, y) => orden.indexOf(x[0]) - orden.indexOf(y[0])).map(([, a]) => a);
  const enlaces = [];
  for (const a of archivos) {
    const ext = a.name.split('.').pop().toLowerCase();
    const r = await fetch(`${cfg.url}/storage/v1/object/sign/${BUCKET}/${encodeURIComponent(a.name)}`, {
      method: 'POST',
      headers: cfg.headers,
      body: JSON.stringify({ expiresIn: 3600 }),
      cache: 'no-store',
    });
    if (!r.ok) continue;
    const { signedURL } = await r.json();
    enlaces.push({
      nombre: a.name,
      etiqueta: ETIQUETAS[ext] ?? `Descargar ${ext.toUpperCase()}`,
      url: `${cfg.url}/storage/v1${signedURL}&download=${encodeURIComponent(`Franquicia-Justa.${ext}`)}`,
    });
  }
  return enlaces;
}
