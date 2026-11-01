import { wa } from '../../data';

export const metadata = { title: 'Tu compra de Franquicia Justa · Nico Pacheco', robots: { index: false } };

const MENSAJES = {
  approved: {
    titulo: '¡Gracias por tu compra!',
    texto:
      'Tu pago está confirmado. Te escribiremos a tu correo con los detalles: el libro digital llega a tu correo, y el físico se despacha o se coordina el retiro apenas termine la preventa.',
  },
  pending: {
    titulo: 'Tu pago está en proceso',
    texto:
      'Mercado Pago todavía está confirmando el pago. Apenas se apruebe te escribiremos a tu correo; no necesitas hacer nada más.',
  },
  failure: {
    titulo: 'El pago no se completó',
    texto:
      'No se hizo ningún cargo. Puedes volver a intentarlo con otro medio de pago, o escribirnos por WhatsApp y te ayudamos.',
  },
};

export default async function Gracias({ searchParams }) {
  const p = await searchParams;
  const estado = p?.collection_status || p?.status;
  const clave = estado === 'approved' ? 'approved' : estado === 'rejected' || estado === 'null' || estado === 'failure' ? 'failure' : 'pending';
  const m = MENSAJES[clave];

  return (
    <main className="lb gracias">
      <div className="gracias-caja">
        <p className="gracias-libro">Franquicia Justa</p>
        <h1>{m.titulo}</h1>
        <p>{m.texto}</p>
        <div className="gracias-botones">
          {clave === 'failure' ? (
            <a href="/#comprar-libro" className="lb-btn">
              Intentar de nuevo
            </a>
          ) : (
            <a href="/" className="lb-btn">
              Volver al sitio
            </a>
          )}
          <a
            href={wa('Hola Nico, tengo una consulta sobre mi compra del libro Franquicia Justa.')}
            className="gracias-wa"
            target="_blank"
            rel="noopener noreferrer"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
