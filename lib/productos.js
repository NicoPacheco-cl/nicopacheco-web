// Lee programas, libro y planillas desde Supabase (editables en /admin).
// Si la base no responde, usa los datos de respaldo de app/data.js.
import { servicios as respaldoServicios, tienda as respaldoTienda, fichas } from '../app/data';

export const pesos = (n) => `$${Number(n).toLocaleString('es-CL')}`;

function respaldo() {
  const lista = [];
  for (const s of respaldoServicios.flatMap((g) => g.items)) {
    if (!s.mosaico) continue;
    lista.push({
      id: s.id, tipo: 'servicio', nombre: s.nombre, titulo_corto: s.mosaico.titulo, etiqueta: s.mosaico.etiqueta,
      fondo: s.mosaico.fondo, marca: s.mosaico.marca, resena: s.resena, importancia: s.importancia,
      precio: null, precio_anterior: null, precio_texto: s.precio, accion: s.accion, pago_online: false,
      activo: true, orden: 0, padre: null,
    });
  }
  lista.push(
    { id: 'libro-fisico', tipo: 'libro', nombre: 'Franquicia Justa, libro físico', precio: 14990, precio_anterior: 29990, pago_online: true, activo: true },
    { id: 'libro-digital', tipo: 'libro', nombre: 'Franquicia Justa, libro digital', precio: 7990, pago_online: true, activo: true }
  );
  for (const t of respaldoTienda.filter((t) => !t.id.startsWith('libro'))) {
    lista.push({ id: t.id, tipo: 'planilla', nombre: t.nombre, resena: t.detalle, precio: Number(t.precio.replace(/\D/g, '')), activo: true, pago_online: false });
  }
  return lista;
}

export async function obtenerProductos() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clave) return respaldo();
  try {
    const r = await fetch(`${url}/rest/v1/productos?activo=eq.true&order=orden.asc`, {
      headers: { apikey: clave },
      next: { revalidate: 60 },
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    const filas = await r.json();
    return filas.length ? filas : respaldo();
  } catch (e) {
    console.error('[productos]', e);
    return respaldo();
  }
}

// Texto de precio que ve el visitante
export function precioVisible(p) {
  if (p.precio_texto) return p.precio_texto;
  if (p.precio != null) return pesos(p.precio);
  return 'A cotizar';
}

// Forma que usa el mosaico de servicios
export function itemsMosaico(productos) {
  const servicios = productos.filter((p) => p.tipo === 'servicio');
  return servicios
    .filter((p) => !p.padre)
    .map((p) => {
      const hijos = servicios.filter((h) => h.padre === p.id);
      const opciones = [p, ...hijos]
        .filter((o) => o.pago_online && o.precio != null)
        .map((o) => ({ id: o.id, nombre: o.nombre, precio: o.precio, accion: o.accion || 'Pagar', texto: precioVisible(o) }));
      return {
        id: p.id,
        nombre: p.nombre,
        resena: p.resena,
        importancia: p.importancia,
        precio: [p, ...hijos].map(precioVisible).join(', o '),
        accion: p.accion || 'Pedir cotización',
        opciones,
        ficha: fichas[p.id] ?? null,
        href: fichas[p.id]?.href,
        mosaico: {
          titulo: p.titulo_corto || p.nombre,
          etiqueta: p.etiqueta || '',
          fondo: p.fondo || '#2a2a2a',
          marca: p.marca || '',
        },
      };
    });
}
