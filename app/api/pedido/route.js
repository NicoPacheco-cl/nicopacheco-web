import {
  crearPedido,
  actualizarPedido,
  mercadoPago,
  origenSitio,
  obtenerProducto,
  evaluarCodigo,
} from '../../../lib/servidor';

const ENTREGAS = ['despacho', 'retiro_puerto_montt', 'retiro_puerto_varas'];
const limpio = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const correoValido = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);

export async function POST(request) {
  let d;
  try {
    d = await request.json();
  } catch {
    return Response.json({ error: 'No pudimos leer el formulario. Recarga la página e inténtalo de nuevo.' }, { status: 400 });
  }

  const producto = await obtenerProducto(d.producto);
  if (!producto || !producto.pago_online || producto.precio == null) {
    return Response.json({ error: 'Este producto no está disponible para pago en línea.' }, { status: 400 });
  }

  const fisico = producto.id === 'libro-fisico';
  const cantidad = fisico ? Math.min(10, Math.max(1, parseInt(d.cantidad, 10) || 1)) : 1;
  const nombre = limpio(d.nombre, 120);
  const correo = limpio(d.correo, 160).toLowerCase();
  const telefono = limpio(d.telefono, 30);
  const entrega = fisico ? (ENTREGAS.includes(d.entrega) ? d.entrega : 'despacho') : null;

  const errores = [];
  if (nombre.length < 2) errores.push('tu nombre');
  if (!correoValido(correo)) errores.push('un correo válido');
  if ((fisico || producto.tipo === 'servicio') && telefono.length < 8) errores.push('un teléfono de contacto');
  if (entrega === 'despacho') {
    if (limpio(d.direccion).length < 5) errores.push('la dirección');
    if (limpio(d.comuna).length < 2) errores.push('la comuna');
    if (limpio(d.region).length < 2) errores.push('la región');
  }
  if (!d.acepta) errores.push('la aceptación del uso de tus datos');
  if (errores.length) return Response.json({ error: `Falta ${errores.join(', ')}.` }, { status: 400 });

  const subtotal = producto.precio * cantidad;
  let codigo = null;
  let descuento = 0;
  if (d.codigo) {
    const ev = await evaluarCodigo(d.codigo, producto, subtotal);
    if (!ev.valido) return Response.json({ error: ev.mensaje }, { status: 400 });
    codigo = ev.codigo;
    descuento = ev.descuento;
  }
  const total = subtotal - descuento;
  const origen = origenSitio(request);

  try {
    const pedido = await crearPedido({
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      tipo: producto.tipo,
      cantidad,
      precio_unitario: producto.precio,
      subtotal,
      codigo,
      descuento,
      total,
      nombre,
      correo,
      telefono: telefono || null,
      empresa: limpio(d.empresa, 120) || null,
      entrega,
      direccion: entrega === 'despacho' ? limpio(d.direccion) : null,
      comuna: entrega === 'despacho' ? limpio(d.comuna, 80) : null,
      region: entrega === 'despacho' ? limpio(d.region, 80) : null,
      rut: limpio(d.rut, 20) || null,
      notas: limpio(d.notas, 500) || null,
    });
    if (!pedido) throw new Error('No se pudo guardar el pedido');
    const gracias = `${origen}/gracias?pedido=${pedido.id}`;

    // Un código del 100% deja el pedido pagado sin pasar por Mercado Pago.
    if (total <= 0) {
      await actualizarPedido(pedido.id, { estado: 'pagado', mp_estado_detalle: 'gratis_con_codigo' });
      return Response.json({ url: gracias });
    }

    const preferencia = await mercadoPago('/checkout/preferences', {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            id: producto.id,
            title: `${producto.nombre}${cantidad > 1 ? ` (x${cantidad})` : ''}${codigo ? ` · código ${codigo}` : ''}`,
            quantity: 1,
            unit_price: total,
            currency_id: 'CLP',
          },
        ],
        payer: { name: nombre, email: correo },
        external_reference: pedido.id,
        back_urls: { success: gracias, pending: gracias, failure: gracias },
        auto_return: 'approved',
        notification_url: `${origen}/api/pago/webhook`,
        statement_descriptor: 'NICOPACHECO',
        metadata: { producto: producto.id, pedido: pedido.id, codigo },
      }),
    });

    await actualizarPedido(pedido.id, { mp_preferencia_id: preferencia.id });
    return Response.json({ url: preferencia.init_point });
  } catch (e) {
    console.error('[pedido]', e);
    return Response.json(
      { error: 'No pudimos iniciar el pago en este momento. Escríbenos por WhatsApp y lo resolvemos.' },
      { status: 502 }
    );
  }
}
