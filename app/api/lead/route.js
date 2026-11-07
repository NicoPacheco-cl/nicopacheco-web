import { cliente } from '../../../lib/base-servidor';

// Registra un contacto que deja sus datos en el sitio (por ahora, antes del diagnóstico gratis).
export const VERSION_LEAD = 'lead1-2026-11-07';
const ORIGENES = ['diagnostico'];
const limpio = (v, max = 160) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const correoValido = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);

export async function POST(request) {
  let d;
  try {
    d = await request.json();
  } catch {
    return Response.json({ error: 'No pudimos leer el formulario. Recarga la página e inténtalo de nuevo.' }, { status: 400 });
  }

  const nombre = limpio(d.nombre, 120);
  const correo = limpio(d.correo).toLowerCase();
  const telefono = limpio(d.telefono, 30);
  const errores = [];
  if (nombre.length < 2) errores.push('tu nombre');
  if (!correoValido(correo)) errores.push('un correo válido');
  if (telefono.replace(/\D/g, '').length < 8) errores.push('un teléfono de contacto');
  if (d.aceptaDatos !== true) errores.push('la autorización para usar tus datos');
  if (errores.length) return Response.json({ error: `Falta ${errores.join(', ')}.` }, { status: 400 });

  const sb = cliente();
  if (!sb) {
    // Sin base configurada (por ejemplo en desarrollo) no se bloquea el diagnóstico.
    console.error('Lead sin guardar: falta configurar Supabase');
    return Response.json({ ok: true, guardado: false });
  }
  const h = request.headers;
  const { error } = await sb.from('leads').insert({
    origen: ORIGENES.includes(d.origen) ? d.origen : 'diagnostico',
    nombre,
    correo,
    telefono,
    empresa: limpio(d.empresa, 120) || null,
    rubro: limpio(d.rubro, 80) || null,
    acepta_datos: true,
    acepta_novedades: d.aceptaNovedades === true,
    version_consentimiento: VERSION_LEAD,
    ip: (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim().slice(0, 64) || null,
    navegador: h.get('user-agent')?.slice(0, 300) || null,
  });
  if (error) {
    console.error('No se pudo guardar el lead', error.message);
    return Response.json({ error: 'No pudimos guardar tus datos. Inténtalo de nuevo en un momento.' }, { status: 500 });
  }
  return Response.json({ ok: true, guardado: true });
}
