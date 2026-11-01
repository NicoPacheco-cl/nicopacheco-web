import Image from 'next/image';
import ContactForm from './ContactForm';
import Mosaico from './Mosaico';
import Garabatos from './Garabatos';
import {
  respaldo,
  servicios,
  tienda,
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

export default function Home() {
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
                Hay dueños de pymes que trabajan todo el día y aun así no ven crecer su negocio. No
                por falta de esfuerzo, sino por números que nadie les enseñó a leer. Por eso ayudo a
                que tu negocio gane más, valga más y se pueda vender.
              </p>
              <div className="botones">
                <a href="#servicios" className="btn btn-blanco">
                  Conoce mis servicios
                </a>
                <a href="#eventos" className="btn btn-linea-clara">
                  Llévame a tu evento
                </a>
              </div>
            </div>
            <div className="portada-foto">
              <Image
                src="/fotos/recortes/nico-brazos-cruzados.png"
                alt="Nico Pacheco, mentor de pymes y conferencista"
                width={1067}
                height={1600}
                priority
                sizes="(max-width: 860px) 70vw, 460px"
              />
            </div>
          </div>
          <div className="cinta">
            <ul className="contenedor">
              {respaldo.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* HERRAMIENTA GRATUITA */}
        <section className="test" aria-labelledby="titulo-test">
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
            <Mosaico items={servicios.flatMap((g) => g.items).filter((i) => i.mosaico)} />
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

        {/* LIBRO Y TIENDA */}
        <section id="libro" className="libro" aria-labelledby="titulo-libro">
          <div className="contenedor">
            <div className="libro-grilla">
              <div className="libro-portada" aria-hidden="true">
                <span className="libro-portada-titulo">FRANQUICIA</span>
                <span className="libro-portada-suave">justa</span>
                <span className="libro-portada-autor">Nico Pacheco</span>
              </div>
              <div>
                <Titulo id="titulo-libro" fuerte="LEE MI" suave="libro" />
                <p className="libro-texto">
                  <strong>Franquicia Justa</strong> explica cómo funciona una franquicia por dentro:
                  qué se paga, qué se recibe y cómo se construye una relación sana entre la marca y el
                  franquiciado. Si vas a comprar o a ofrecer una franquicia, léelo antes de firmar.
                </p>
                <div className="botones">
                  <a
                    href={wa('Hola Nico, quiero comprar el libro Franquicia Justa (digital, $14.990).')}
                    className="btn btn-negro"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Digital, $14.990
                  </a>
                  <a
                    href={wa('Hola Nico, quiero comprar el libro Franquicia Justa (impreso, $24.990 más envío).')}
                    className="btn btn-linea"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Impreso, $24.990
                  </a>
                </div>
              </div>
            </div>

            <h3 className="tienda-titulo">Planillas para tu negocio</h3>
            <ul className="productos">
              {tienda
                .filter((p) => !p.id.startsWith('libro'))
                .map((p) => (
                  <li key={p.id} className="producto">
                    <div>
                      <h4>{p.nombre}</h4>
                      <p>{p.detalle}</p>
                    </div>
                    <div className="producto-pie">
                      <span className="precio precio-grande">{p.precio}</span>
                      <a
                        href={wa(`Hola Nico, quiero comprar: ${p.nombre} (${p.precio}).`)}
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
        <section className="boletin" aria-labelledby="titulo-boletin">
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
      </footer>
    </>
  );
}
