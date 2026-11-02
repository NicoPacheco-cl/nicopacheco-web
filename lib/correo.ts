import "server-only";

// Envío de correos con Resend. Requiere RESEND_API_KEY y RESEND_FROM en Vercel; si faltan, no envía.
export const correoActivo = () => Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim());
export type Adjunto = { filename: string; content: Uint8Array };

export async function enviarCorreo(para: string, asunto: string, html: string, adjuntos: Adjunto[] = []) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [para], subject: asunto, html,
        ...(adjuntos.length ? { attachments: adjuntos.map((x) => ({ filename: x.filename, content: Buffer.from(x.content).toString("base64") })) } : {}),
      }),
    });
    if (!r.ok) console.error("Resend respondió", r.status, await r.text());
    return r.ok;
  } catch (e) {
    console.error("No se pudo enviar el correo", (e as Error).message);
    return false;
  }
}

export const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
