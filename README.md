# nicopacheco.cl

Sitio personal de Nico Pacheco. Next.js, desplegado en Vercel.

- Textos y precios: `app/data.js`
- Página: `app/page.jsx`
- Estilos: `app/globals.css`
- Fotos: `public/fotos`
- Valorización Pyme: `/valoriza` y `/certificado/[token]`, cálculo en `lib/valorizacion.ts`, certificados en `lib/certificados-servidor.ts`, PDF en `lib/certificado-pdf.ts`, revisión en la pestaña Certificados de `/admin`
- Diagnóstico financiero gratis: `/diagnostico`, cuentas y cálculo en `app/diagnostico/calculo.js`, PDF en `app/diagnostico/pdf.js`. Las respuestas quedan solo en el navegador del visitante
- Claves opcionales en Vercel: `ANTHROPIC_API_KEY` activa la lectura automática de documentos de Gold y Platinum (sin ella se revisan a mano en el panel); `RESEND_API_KEY` y `RESEND_FROM` activan los correos; `CRON_SECRET` protege las tareas diarias
