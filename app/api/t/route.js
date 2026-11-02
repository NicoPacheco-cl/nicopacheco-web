import { supabaseConfig } from '../../../lib/servidor';

const corto = (v, n = 120) => (typeof v === 'string' && v ? v.slice(0, n) : null);
const SECCION = /^[a-z0-9-]{1,40}$/;

function dispositivo(ua = '') {
  if (/bot|crawl|spider|slurp|preview|monitor/i.test(ua)) return 'bot';
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'celular';
  return 'computador';
}

export async function POST(request) {
  const cfg = supabaseConfig();
  if (!cfg) return new Response(null, { status: 204 });
  let d;
  try {
    d = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }
  const sesion = corto(d.sesion, 60);
  if (!sesion) return new Response(null, { status: 204 });

  try {
    if (d.tipo === 'visita') {
      const disp = dispositivo(request.headers.get('user-agent') || '');
      if (disp === 'bot') return new Response(null, { status: 204 });
      let referente = corto(d.referente, 300);
      try {
        if (referente) referente = new URL(referente).hostname.replace(/^www\./, '');
      } catch {
        referente = null;
      }
      await fetch(`${cfg.url}/rest/v1/visitas`, {
        method: 'POST',
        headers: cfg.headers,
        body: JSON.stringify({
          visitante: corto(d.visitante, 60) || 'anonimo',
          sesion,
          ruta: corto(d.ruta, 200) || '/',
          referente,
          fuente: corto(d.fuente, 80),
          medio: corto(d.medio, 80),
          campana: corto(d.campana, 120),
          dispositivo: disp,
          pais: corto(request.headers.get('x-vercel-ip-country'), 4),
        }),
      });
    } else if (d.tipo === 'tiempos' && d.datos && typeof d.datos === 'object') {
      const filas = Object.entries(d.datos)
        .filter(([s, seg]) => SECCION.test(s) && Number.isFinite(seg) && seg > 0)
        .slice(0, 20)
        .map(([seccion, seg]) => ({ sesion, seccion, segundos: Math.min(3600, Math.round(seg)) }));
      if (filas.length) {
        await fetch(`${cfg.url}/rest/v1/tiempos_seccion`, {
          method: 'POST',
          headers: cfg.headers,
          body: JSON.stringify(filas),
        });
      }
    }
  } catch (e) {
    console.error('[t]', e);
  }
  return new Response(null, { status: 204 });
}
