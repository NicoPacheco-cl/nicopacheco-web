import { wa } from '../../data';
import { obtenerPedido, confirmarPagoAprobado, enlacesDeDescarga } from '../../../lib/servidor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tu compra de Franquicia Justa · Nico Pacheco', robots: { index: false } };

const MENSAJES = {
  digital: {
    titulo: '¡Gracias por tu compra!',
    texto: 'Tu pago está confirmado. Descarga tu libro aquí abajo. Guarda esta página en tus favoritos: puedes volver a ella para descargarlo de nuevo.',
  },
  fisico: {
    titulo: '¡Gracias por tu compra!',
    texto:
      'Tu pago está confirmado. Te escribiremos para coordinar el despacho o el retiro apenas termine la preventa.',
  },
  pending: {
    titulo: 'Tu pago está en proceso',
    texto:
      'Mercado Pago todavía está confirmando el pago. Vuelve a abrir esta página en unos minutos; apenas se apruebe verás aquí tu libro.',
  },
  failure: {
    titulo: 'El pago no se completó',
    texto: 'No se hizo ningún cargo. Puedes volver a intentarlo con otro medio de pago, o escribirnos por WhatsApp y te ayudamos.',
  },
};

export default async function Gracias({ searchParams }) {
  const p = await searchParams;
  const estadoMp = p?.collection_status || p?.status;
  let pedido = await obtenerPedido(p?.pedido);

  // Si el aviso de Mercado Pago aún no llegó, lo confirmamos directamente.
  if (pedido && pedido.estado !== 'pagado' && estadoMp !== 'rejected') {
    if (await confirmarPagoAprobado(pedido.id)) pedido = { ...pedido, estado: 'pagado' };
  }

  let clave;
  if (pedido?.estado === 'pagado') clave = pedido.formato;
  else if (estadoMp === 'rejected' || estadoMp === 'null' || pedido?.estado === 'rechazado') clave = 'failure';
  else if (!pedido && estadoMp === 'approved') clave = 'fisico';
  else clave = 'pending';

  const m = MENSAJES[clave];
  const descargas = clave === 'digital' ? await enlacesDeDescarga() : [];

  return (
    <main className="lb gracias">
      <div className="gracias-caja">
        <p className="gracias-libro">Franquicia Justa</p>
        <h1>{m.titulo}</h1>
        <p>{m.texto}</p>

        {clave === 'digital' && (
          <ul className="gracias-descargas">
            {descargas.length > 0 ? (
              descargas.map((d) => (
                <li key={d.nombre}>
                  <a href={d.url} className="lb-btn">
                    {d.etiqueta}
                  </a>
                </li>
              ))
            ) : (
              <li className="gracias-aviso">
                Estamos preparando tu archivo. Escríbenos por WhatsApp y te lo enviamos de inmediato.
              </li>
            )}
          </ul>
        )}

        <div className="gracias-botones">
          {clave === 'failure' ? (
            <a href="/#comprar-libro" className="lb-btn">
              Intentar de nuevo
            </a>
          ) : (
            <a href="/" className={clave === 'digital' ? 'gracias-wa' : 'lb-btn'}>
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
