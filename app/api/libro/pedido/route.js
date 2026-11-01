import { LIBRO, crearPedido, actualizarPedido, mercadoPago, origenSitio } from '../../../../lib/servidor';

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

  const formato = d.formato === 'digital' ? 'digital' : 'fisico';
  const cantidad = formato === 'digital' ? 1 : Math.min(10, Math.max(1, parseInt(d.cantidad, 10) || 1));
  const nombre = limpio(d.nombre, 120);
  const correo = limpio(d.correo, 160).toLowerCase();
  const telefono = limpio(d.telefono, 30);
  const entrega = formato === 'fisico' ? (ENTREGAS.includes(d.entrega) ? d.entrega : 'despacho') : null;

  const errores = [];
  if (nombre.length < 2) errores.push('tu nombre');
  if (!correoValido(correo)) errores.push('un correo válido');
  if (formato === 'fisico' && telefono.length < 8) errores.push('un teléfono de contacto');
  if (entrega === 'despacho') {
    if (limpio(d.direccion).length < 5) errores.push('la dirección');
    if (limpio(d.comuna).length < 2) errores.push('la comuna');
    if (limpio(d.region).length < 2) errores.push('la región');
  }
  if (!d.acepta) errores.push('la aceptación de la política de privacidad');
  if (errores.length) {
    return Response.json({ error: `Falta ${errores.join(', ')}.` }, { status: 400 });
  }

  const precio = LIBRO.precios[formato];
  const total = precio * cantidad;
  const origen = origenSitio(request);

  try {
    const pedido = await crearPedido({
      formato,
      cantidad,
      precio_unitario: precio,
      total,
      nombre,
      correo,
      telefono: telefono || null,
      entrega,
      direccion: entrega === 'despacho' ? limpio(d.direccion) : null,
      comuna: entrega === 'despacho' ? limpio(d.comuna, 80) : null,
      region: entrega === 'despacho' ? limpio(d.region, 80) : null,
      rut: limpio(d.rut, 20) || null,
      notas: limpio(d.notas, 500) || null,
      acepta_privacidad: true,
    });
    const referencia = pedido?.id ?? `sin-registro-${Date.now()}`;

    const preferencia = await mercadoPago('/checkout/preferences', {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            id: `franquicia-justa-${formato}`,
            title: `${LIBRO.titulo} (libro ${formato === 'fisico' ? 'físico, preventa' : 'digital'})`,
            quantity: cantidad,
            unit_price: precio,
            currency_id: 'CLP',
          },
        ],
        payer: { name: nombre, email: correo },
        external_reference: referencia,
        back_urls: {
          success: `${origen}/libro/gracias?pedido=${referencia}`,
          pending: `${origen}/libro/gracias?pedido=${referencia}`,
          failure: `${origen}/libro/gracias?pedido=${referencia}`,
        },
        auto_return: 'approved',
        notification_url: `${origen}/api/libro/webhook`,
        statement_descriptor: 'NICOPACHECO',
        metadata: { formato, entrega, pedido: referencia },
      }),
    });

    if (pedido) await actualizarPedido(pedido.id, { mp_preferencia_id: preferencia.id });

    return Response.json({ url: preferencia.init_point });
  } catch (e) {
    console.error('[libro/pedido]', e);
    return Response.json(
      { error: 'No pudimos iniciar el pago en este momento. Escríbenos por WhatsApp y lo resolvemos.' },
      { status: 502 }
    );
  }
}
