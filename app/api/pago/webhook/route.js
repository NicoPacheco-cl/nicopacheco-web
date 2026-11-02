import { mercadoPago, registrarPago } from '../../../../lib/servidor';

// Mercado Pago avisa aquí cada cambio de un pago. No confiamos en el aviso:
// consultamos el pago directamente a Mercado Pago antes de actualizar el pedido.
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
    await registrarPago(pago.external_reference, pago);
  } catch (e) {
    console.error('[pago/webhook]', e);
    return new Response('error', { status: 500 });
  }
  return new Response('ok');
}

export function GET() {
  return new Response('ok');
}
