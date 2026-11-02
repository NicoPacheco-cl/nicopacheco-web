import "server-only";

// Dirección del sitio, plantilla de correo y Mercado Pago para las valorizaciones.
export function sitio(req?: Request) {
  const env = process.env.SITIO_URL?.trim() || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  if (env) return env.replace(/\/$/, "");
  return req ? new URL(req.url).origin : "https://nicopacheco.cl";
}

export function plantilla(titulo: string, cuerpo: string, boton?: { texto: string; href: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f2efe9;font-family:Arial,Helvetica,sans-serif;color:#0d0d0d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2efe9;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff">
<tr><td style="background:#0d0d0d;padding:16px 22px;color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:.04em">NICO PACHECO®</td></tr>
<tr><td style="padding:22px">
<h1 style="font-size:20px;margin:0 0 12px">${titulo}</h1>
${cuerpo}
${boton ? `<p style="margin:22px 0 4px"><a href="${boton.href}" style="background:#0d0d0d;color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:bold;display:inline-block">${boton.texto}</a></p>` : ""}
</td></tr>
<tr><td style="padding:14px 22px;background:#f2efe9;font-size:12px;color:#5c5c5c">Nico Pacheco · nikolaspacheco@gmail.com<br>Recibes este correo por tu valorización en nicopacheco.cl.</td></tr>
</table></td></tr></table></body></html>`;
}

const tokenMP = () => (process.env.MP_ACCESS_TOKEN ?? "").trim().replace(/^["']|["']$/g, "").trim();
export const pagosActivos = () => Boolean(tokenMP());

export async function preferenciaMP(opt: Parameters<typeof preferenciaMPsinControl>[0]) {
  try {
    return await preferenciaMPsinControl(opt);
  } catch (e) {
    console.error("Mercado Pago no respondió al crear el cobro", e instanceof Error ? e.message : e);
    return null;
  }
}

async function preferenciaMPsinControl(opt: {
  id: string; titulo: string; precio: number; correo: string; nombre: string;
  referencia: string; volver: string; aviso: string;
}) {
  // Si Mercado Pago no responde (caída, red o demora de más de 15 s) se devuelve null y cada pago muestra
  // «Mercado Pago no respondió» en vez de un error del servidor (encontrado en las pruebas del 22 oct 2026).
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    signal: AbortSignal.timeout(15000),
    method: "POST",
    headers: { Authorization: `Bearer ${tokenMP()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ id: opt.id, title: opt.titulo.slice(0, 250), quantity: 1, currency_id: "CLP", unit_price: opt.precio }],
      payer: { email: opt.correo, name: opt.nombre },
      external_reference: opt.referencia,
      back_urls: { success: opt.volver, pending: opt.volver, failure: opt.volver },
      auto_return: "approved",
      notification_url: opt.aviso,
      statement_descriptor: "NICOPACHECO",
    }),
  });
  if (!r.ok) {
    console.error("Mercado Pago respondió", r.status, await r.text());
    return null;
  }
  return (await r.json()) as { id: string; init_point: string };
}

export async function consultarPago(id: string) {
  try {
    return await consultarPagoSinControl(id);
  } catch (e) {
    console.error("Mercado Pago no respondió al consultar el pago", id, e instanceof Error ? e.message : e);
    return null; // el aviso automático de Mercado Pago se reintenta solo
  }
}

async function consultarPagoSinControl(id: string) {
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, {
    signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${tokenMP()}` },
    cache: "no-store",
  });
  if (!r.ok) return null;
  return (await r.json()) as { id: number; status: string; external_reference: string; transaction_amount: number; currency_id: string };
}

