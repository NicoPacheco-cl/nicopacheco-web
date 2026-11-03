import Image from 'next/image';
import ContactForm from './ContactForm';
import Mosaico from './Mosaico';
import Garabatos from './Garabatos';
import LibroCompra from './LibroCompra';
import { obtenerProductos, itemsMosaico, pesos } from '../lib/productos';
import {
  cifras,
  charlas,
  entradas,
  trayectoria,
  medios,
  LINKEDIN,
  YOUTUBE,
  wa,
} from './data';

const contacto = (interes) => `?interes=${interes}#contacto`;

const menu = [
  { href: '#sobre-mi', label: 'Sobre mí' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#podcast', label: 'Podcast' },
  { href: '#libro', label: 'Libro y tienda' },
];

// Título en dos voces: mayúsculas compactas + palabra en cursiva
function Titulo({ como: Etiqueta = 'h2', fuerte, suave, id, claro }) {
  return (
    <Etiqueta id={id} className={claro ? 'titulo titulo-claro' : 'titulo'}>
      <span className="titulo-fuerte">{fuerte}</span> <span className="titulo-suave">{suave}</span>
    </Etiqueta>
  );
}

export const revalidate = 60;

export default async function Home() {
  const productos = await obtenerProductos();
  const libroFisico = productos.find((p) => p.id === 'libro-fisico');
  const libroDigital = productos.find((p) => p.id === 'libro-digital');
  const precios = {
    fisico: libroFisico?.precio ?? 14990,
    fisicoAnterior: libroFisico?.precio_anterior ?? null,
    digital: libroDigital?.precio ?? 7990,
  };
  const planillas = productos.filter((p) => p.tipo === 'planilla');
  return (
    <>
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>

      <header className="cabecera">
        <div className="contenedor cabecera-fila">
          <a href="#inicio" className="marca">
            NICO PACHECO<sup>®</sup>
          </a>
          <nav className="menu" aria-label="Principal">
            {menu.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>
          <a href="#eventos" className="btn btn-blanco btn-chico cabecera-cta">
            Llévame a tu evento
          </a>
          <details className="menu-movil">
            <summary aria-label="Abrir menú">Menú</summary>
            <nav aria-label="Principal en celular">
              {menu.map((n) => (
                <a key={n.href} href={n.href}>
                  {n.label}
                </a>
              ))}
              <a href="#eventos">Conferencias y seminarios</a>
              <a href="#contacto">Contacto</a>
            </nav>
          </details>
        </div>
      </header>

      <main id="contenido">
        {/* PORTADA */}
        <section id="inicio" className="portada">
          <div className="contenedor portada-grilla">
            <div className="portada-texto">
              <h1 className="portada-nombre">
                NICO
                <br />
                PACHECO.
              </h1>
              <p className="portada-mision">
                Mentor de pymes, director de empresas y conferencista. Te ayudo a que tu negocio gane
                más, valga más y se pueda vender.
              </p>
              <div className="botones">
                <a href="#servicios" className="btn btn-negro">
                  Conoce mis servicios
                </a>
                <a href="#eventos" className="btn btn-linea">
                  Llévame a tu evento
                </a>
              </div>
            </div>
            <div className="portada-foto">
              <Image
                src="/fotos/recortes/nico-sentado.png"
                alt="Nico Pacheco, mentor de pymes y conferencista"
                width={1100}
                height={1482}
                priority
                sizes="(max-width: 860px) 100vw, 520px"
              />
            </div>
          </div>
          <div className="contenedor">
            <ul className="cifras">
              {cifras.map((c) => (
                <li key={c.texto}>
                  <span className="cifra-valor">{c.valor}</span>
                  <span className="cifra-texto">{c.texto}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="medios" aria-label="Medios donde ha sido entrevistado">
            <p className="contenedor medios-rotulo">Me han entrevistado en</p>
            <div className="medios-pista">
              {[0, 1].map((copia) => (
                <ul key={copia} aria-hidden={copia === 1 ? 'true' : undefined}>
                  {medios.map((m, i) => (
                    <li key={m} className={i % 2 ? 'medio medio-serif' : 'medio'}>
                      {m}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>

        {/* DIAGNÓSTICO FINANCIERO GRATIS */}
        <section id="diagnostico-gratis" className="dg" aria-labelledby="titulo-dg">
          <div className="contenedor dg-grilla">
            <div>
              <p className="rotulo dg-rotulo">Diagnóstico financiero gratis</p>
              <Titulo id="titulo-dg" fuerte="SABER LOS NÚMEROS DE TU NEGOCIO NO ES IMPORTANTE," suave="es imprescindible." />
            </div>
            <a href={contacto('diagnostico-gratis')} className="btn btn-negro">
              Realiza este diagnóstico gratis
            </a>
          </div>
        </section>

        {/* HERRAMIENTA GRATUITA */}
        <section id="planilla-gratis" className="test" aria-labelledby="titulo-test">
          <div className="contenedor test-grilla">
            <Titulo id="titulo-test" fuerte="¿SABES CUÁNTA PLATA" suave="te queda a fin de mes?" />
            <div>
              <p>
                La mayoría de las pymes vende bien y aun así no sabe dónde se le va el margen.
                Descarga gratis la planilla de flujo de caja que uso para partir cada diagnóstico y
                mira tus números con claridad en una tarde.
              </p>
              <a href={contacto('planilla-gratis')} className="btn btn-negro">
                Quiero la planilla gratis
              </a>
            </div>
          </div>
        </section>

        {/* SERVICIOS */}
        <section id="servicios" className="servicios" aria-labelledby="titulo-servicios">
          <div className="contenedor">
            <p className="rotulo">Líneas de negocio</p>
            <Titulo id="titulo-servicios" fuerte="MIS" suave="servicios" claro />
            <Mosaico items={itemsMosaico(productos)} />
            <p className="servicios-nota">
              Toca un servicio para ver el detalle y el valor. Si no sabes por dónde partir, parte por el
              Diagnóstico Pyme.
            </p>
          </div>
        </section>

        {/* PODCAST */}
        <section id="podcast" className="podcast" aria-labelledby="titulo-podcast">
          <div className="contenedor podcast-grilla">
            <div>
              <Titulo id="titulo-podcast" fuerte="EMPRENDE" suave="bien." claro />
              <p className="podcast-bajada">
                El podcast para emprender con los números claros: conversaciones con dueños de
                negocios sobre ventas, márgenes, errores y decisiones que hacen crecer una empresa.
              </p>
            </div>
            <div className="podcast-acciones">
              <p className="podcast-estado">El primer episodio se estrena pronto.</p>
              <div className="plataformas">
                {YOUTUBE ? (
                  <a href={YOUTUBE} className="btn btn-blanco" target="_blank" rel="noopener noreferrer">
                    Ver en YouTube
                  </a>
                ) : (
                  <a href={contacto('podcast')} className="btn btn-blanco">
                    Avísame del estreno
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* LIBRO */}
        <section id="libro" className="lb" aria-labelledby="titulo-libro">
          <div className="lb-hero">
            <div className="contenedor lb-in">
              <a href="#comprar-libro" className="l3d" aria-label="Comprar el libro Franquicia Justa">
                <div className="l3d-cuerpo">
                  <div className="l3d-contra" />
                  <div className="l3d-paginas" />
                  <div className="l3d-lomo" aria-hidden="true">
                    <span>
                      FRANQUICIA <b>JUSTA</b>
                    </span>
                    <small>M. PACHECO ORTIZ</small>
                  </div>
                  <div className="l3d-tapa">
                    <Image
                      src="/fotos/libro/franquicia-justa-portada.jpg"
                      alt="Portada del libro Franquicia Justa, de Maximiliano Pacheco Ortiz"
                      width={900}
                      height={1350}
                      sizes="(max-width: 760px) 200px, 300px"
                    />
                  </div>
                </div>
                <div className="l3d-sombra" />
              </a>

              <div className="lb-texto">
                <span className="lb-pill">PREVENTA · NUEVO LIBRO</span>
                <h2 id="titulo-libro" className="lb-titulo">
                  Franquicia Justa
                </h2>
                <p className="lb-sub">Reemplazando la subordinación por la colaboración</p>
                <p className="lb-desc">
                  Los 7 pilares para crear, elegir y hacer crecer franquicias donde todos ganan. Por
                  Maximiliano Pacheco Ortiz.
                </p>
                <p className="lb-meta">Prólogo de Gerardo Wijnant S.M. · 15 × 24 cm · ISBN 978-956-03-1419-2</p>
                <div className="lb-precios">
                  <div className="lb-precio">
                    <small>FÍSICO · PREVENTA</small>
                    <div>
                      {precios.fisicoAnterior ? <s>{pesos(precios.fisicoAnterior)}</s> : null} <strong>{pesos(precios.fisico)}</strong>
                    </div>
                  </div>
                  <div className="lb-precio">
                    <small>DIGITAL</small>
                    <div>
                      <strong>{pesos(precios.digital)}</strong>
                    </div>
                    <span>Kindle · Apple Books · PDF</span>
                  </div>
                </div>
                <a href="#comprar-libro" className="lb-btn">
                  Comprar ahora
                </a>
              </div>
            </div>
          </div>

          <div className="contenedor lb-cuerpo">
            <h3 className="lb-h">Para quién es</h3>
            <p className="lb-p">
              Para quien está pensando en invertir en una franquicia, para el emprendedor que quiere
              franquiciar su marca y transformarla en una cadena, y para quienes ya están dentro del
              sistema y sienten que algo no está funcionando como debería.
            </p>
            <div className="lb-rutas">
              <div>
                <strong>Ruta del franquiciado</strong>
                <p>Distingue una franquicia real de una que solo se hace llamar así, y elige sin equivocarte.</p>
              </div>
              <div>
                <strong>Ruta del franquiciador</strong>
                <p>Transforma tu marca en una Franquicia Justa, paso a paso.</p>
              </div>
            </div>

            <h3 className="lb-h">Los 7 pilares de la Franquicia Justa</h3>
            <ol className="lb-pilares">
              {[
                'Transparencia financiera',
                'Una estructura que respalda',
                'El franquiciado como socio',
                'Propósito compartido',
                'Proveedores que suman',
                'Un contrato que se adapta',
                'Una salida digna',
              ].map((p, i) => (
                <li key={p}>
                  <span>{i + 1}</span>
                  {p}
                </li>
              ))}
            </ol>
            <p className="lb-nota">
              Incluye el autodiagnóstico «¿Es justa tu franquicia?», las proformas de los 8 negocios más
              franquiciados, 10 casos reales, plantilla de proforma financiera y checklist de due
              diligence.
            </p>

            <div id="comprar-libro" className="lc-ancla">
              <LibroCompra precios={precios} />
            </div>
          </div>
        </section>

        {/* TIENDA */}
        <section id="tienda" className="tienda" aria-labelledby="titulo-tienda">
          <div className="contenedor">
            <Titulo id="titulo-tienda" fuerte="PLANILLAS PARA" suave="tu negocio" />
            <ul className="productos">
              {planillas
                .map((p) => (
                  <li key={p.id} className="producto">
                    <div>
                      <h4>{p.nombre}</h4>
                      <p>{p.resena}</p>
                    </div>
                    <div className="producto-pie">
                      <span className="precio precio-grande">{p.precio_texto || pesos(p.precio)}</span>
                      <a
                        href={wa(`Hola Nico, quiero comprar: ${p.nombre} (${p.precio_texto || pesos(p.precio)}).`)}
                        className="btn btn-negro btn-chico"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Comprar
                      </a>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </section>

        {/* EVENTOS */}
        <section id="eventos" className="eventos" aria-labelledby="titulo-eventos">
          <div className="eventos-foto">
            <Image
              src="/fotos/conferencias/duoc-arauco-auditorio-lleno.jpg"
              alt="Conferencia ante un auditorio lleno en Duoc UC Campus Arauco"
              fill
              sizes="100vw"
            />
            <p className="pie-foto">Duoc UC Campus Arauco, 2023</p>
          </div>
          <div className="contenedor eventos-grilla">
            <div>
              <Titulo id="titulo-eventos" fuerte="¿LO LLEVAMOS A" suave="tu evento?" claro />
              <p className="eventos-bajada">
                Conferencias para empresas, universidades y gremios, con historias reales de negocios
                y un mensaje claro: el público sale con un plan.
              </p>
              <ul className="charlas">
                {charlas.map((c) => (
                  <li key={c.titulo}>
                    <h3>{c.titulo}</h3>
                    <p>{c.detalle}</p>
                  </li>
                ))}
              </ul>
              <a href={contacto('conferencia')} className="btn btn-blanco">
                Cotiza una conferencia
              </a>
            </div>
            <div className="seminarios">
              <h3>Seminarios para dueños de pymes</h3>
              <p>
                Tres veces al año: una jornada presencial de finanzas, ventas y crecimiento, con casos
                reales y tiempo para tus preguntas.
              </p>
              <ul className="entradas">
                {entradas.map((e) => (
                  <li key={e.tipo}>
                    <span>
                      {e.tipo}
                      {e.nota && <small> {e.nota}</small>}
                    </span>
                    <span className="precio">{e.precio}</span>
                  </li>
                ))}
              </ul>
              <a href={contacto('seminario')} className="btn btn-linea-clara">
                Avísame de la preventa
              </a>
            </div>
          </div>
        </section>

        {/* SOBRE MÍ */}
        <section id="sobre-mi" className="sobre" aria-labelledby="titulo-sobre">
          <div className="sobre-escena">
            <Garabatos />
            <Image
              src="/fotos/servicios-azul-frontal.jpg"
              alt="Nico Pacheco con chaqueta azul, de frente y con las manos sobre la mesa"
              width={1800}
              height={1553}
              sizes="(max-width: 860px) 100vw, 720px"
              className="sobre-retrato"
            />
          </div>
          <div className="contenedor sobre-texto">
            <p className="rotulo" id="titulo-sobre">
              Sobre mí
            </p>
            <p className="sobre-grande">
              Dueños de pymes que trabajan todo el día y aun así no ven crecer su negocio. No por falta
              de esfuerzo, sino por números que nadie les enseñó a leer. Por eso hago lo que hago:
              ayudar a que tu negocio gane más, valga más y se pueda vender.
            </p>
            <div className="sobre-detalle">
              <p>
                Soy director de empresas, mentor y conferencista. He dirigido negocios de gastronomía,
                hotelería y turismo en el sur de Chile, y llevé una cadena de comida rápida saludable a
                14 franquicias. Tengo un MBA de la Universidad Europea de Madrid y un Mágister en
                Dirección Comercial, Marketing e Innovación de la Universidad Andrés Bello.
              </p>
              <p className="sobre-medios">
                Me han entrevistado en {medios.slice(0, -1).join(', ')} y {medios.at(-1)}.
              </p>
              <details className="trayectoria">
                <summary>Ver trayectoria</summary>
                <ol>
                  {trayectoria.map((t) => (
                    <li key={t.periodo + t.lugar}>
                      <span className="periodo">{t.periodo}</span>
                      <span>
                        <strong>{t.cargo}</strong>, {t.lugar}
                      </span>
                    </li>
                  ))}
                </ol>
              </details>
              <a href={LINKEDIN} className="enlace" target="_blank" rel="noopener noreferrer">
                Perfil en LinkedIn
              </a>
            </div>
          </div>
        </section>

        {/* NEWSLETTER */}
        <section id="boletin" className="boletin" aria-labelledby="titulo-boletin">
          <div className="contenedor boletin-grilla">
            <div>
              <Titulo id="titulo-boletin" fuerte="LA" suave="Bitácora Pyme" />
              <p>
                Un correo al mes con una herramienta, un caso real y un número que todo dueño de pyme
                debería mirar. Sin relleno.
              </p>
            </div>
            <a href={contacto('boletin')} className="btn btn-negro">
              Suscribirme
            </a>
          </div>
        </section>

        {/* CONTACTO */}
        <section id="contacto" className="contacto" aria-labelledby="titulo-contacto">
          <div className="contenedor contacto-grilla">
            <div>
              <Titulo id="titulo-contacto" fuerte="HABLEMOS DE" suave="tu negocio" claro />
              <p>
                Cuéntame en qué estás y te respondo con el siguiente paso. Para conferencias, indica
                ciudad, fecha y tamaño del público.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <a
        className="whatsapp"
        href={wa('Hola Nico, vengo de nicopacheco.cl y quiero conversar sobre mi negocio.')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir por WhatsApp"
      >
        <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8C29 8.7 23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.3-3.8 1.2 1.2-3.7-.3-.4a10.4 10.4 0 0 1-1.7-5.7C5.1 9.9 10 5.2 16 5.2s10.9 4.7 10.9 10.6S22 26.4 16 26.4zm6-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.7 1.2 3.1 1.4 3.4 2.3 3.6 5.6 5c2.1.9 2.9 1 4 .8.6-.1 1.9-.8 2.2-1.5s.3-1.4.2-1.5-.3-.2-.6-.4z"
          />
        </svg>
        <span>WhatsApp</span>
      </a>

      <footer className="pie">
        <div className="contenedor pie-fila">
          <p className="pie-marca">NICO PACHECO®</p>
          <nav aria-label="Pie de página">
            {menu.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
            <a href="#eventos">Conferencias</a>
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href={wa('Hola Nico, vengo de nicopacheco.cl.')} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </nav>
          <p className="pie-lugar">Puerto Varas, Chile</p>
        </div>
        <div className="contenedor pie-admin">
          <a href="/admin" rel="nofollow">ADMINISTRADOR</a>
        </div>
      </footer>
    </>
  );
}
