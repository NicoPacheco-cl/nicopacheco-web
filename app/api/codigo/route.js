import { obtenerProducto, evaluarCodigo } from '../../../lib/servidor';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const u = new URL(request.url);
  const producto = await obtenerProducto(u.searchParams.get('producto'));
  if (!producto || producto.precio == null) return Response.json({ valido: false, mensaje: 'Producto no disponible.' });
  const cantidad = producto.id === 'libro-fisico' ? Math.min(10, Math.max(1, parseInt(u.searchParams.get('cantidad'), 10) || 1)) : 1;
  const ev = await evaluarCodigo(u.searchParams.get('codigo'), producto, producto.precio * cantidad);
  return Response.json(ev);
}
