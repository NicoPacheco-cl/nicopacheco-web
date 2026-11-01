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
