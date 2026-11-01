import { ESTADOS_MP, actualizarPedido, mercadoPago } from '../../../../lib/servidor';

// Mercado Pago avisa aquí cada cambio de un pago. No confiamos en el aviso:
// volvemos a consultar el pago directamente a Mercado Pago antes de actualizar el pedido.
export async function POST(request) {
  const url = new URL(request.url);
  let cuerpo = {};
  try {
    cuerpo = await request.json();
  } catch {}

  const tipo = cuerpo.type || url.searchParams.get('type') || url.searchParams.get('topic');
  const pagoId = cuerpo?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id');

  if (tipo !== 'payment' || !pagoId) return new Response('ok');

  try {
    const pago = await mercadoPago(`/v1/payments/${encodeURIComponent(pagoId)}`);
    await actualizarPedido(pago.external_reference, {
      estado: ESTADOS_MP[pago.status] ?? 'pendiente',
      mp_pago_id: String(pago.id),
      mp_estado_detalle: pago.status_detail ?? null,
    });
  } catch (e) {
    console.error('[libro/webhook]', e);
    // Respondemos con error para que Mercado Pago reintente más tarde.
    return new Response('error', { status: 500 });
  }
  return new Response('ok');
}

export function GET() {
  return new Response('ok');
}
