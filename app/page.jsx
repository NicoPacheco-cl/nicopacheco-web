import Image from 'next/image';
import ContactForm from './ContactForm';
import {
  nav,
  medios,
  cifras,
  resultados,
  servicios,
  tienda,
  charlas,
  entradas,
  trayectoria,
  prensa,
  LINKEDIN,
  wa,
} from './data';

const contacto = (interes) => `?interes=${interes}#contacto`;

export default function Home() {
  return (
    <>
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>

      <header className="cabecera">
        <div className="contenedor cabecera-fila">
          <a href="#inicio" className="marca">
            Nico Pacheco
          </a>
          <nav className="menu" aria-label="Principal">
            {nav.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>
          <a href="#contacto" className="btn btn-claro btn-chico">
            Hablemos
          </a>
          <details className="menu-movil">
            <summary aria-label="Abrir menú">Menú</summary>
            <nav aria-label="Principal en celular">
              {nav.map((n) => (
                <a key={n.href} href={n.href}>
                  {n.label}
                </a>
              ))}
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
              <p className="portada-quien">Mentor de pymes, director de empresas y conferencista</p>
              <h1>Hago que tu pyme gane más, valga más y se pueda vender.</h1>
              <p className="portada-bajada">
                Llevé una cadena de comida a 14 franquicias y una valorización de USD 12 millones.
                Hoy acompaño a dueños de negocios en Chile a ordenar sus números, crecer y salir
                bien parados cuando venden.
              </p>
              <div className="botones">
                <a href={contacto('diagnostico')} className="btn btn-verde">
                  Agenda tu Diagnóstico Pyme
                </a>
                <a href={contacto('planilla-gratis')} className="btn btn-linea-clara">
                  Pide gratis la planilla de flujo de caja
                </a>
              </div>
            </div>
            <figure className="portada-foto">
              <Image
                src="/fotos/hero-movil.jpg"
                alt="Retrato de Nico Pacheco con chaqueta azul de terciopelo"
                width={1200}
                height={1800}
                priority
                sizes="(max-width: 860px) 70vw, 420px"
              />
            </figure>
          </div>
          <div className="medios">
            <div className="contenedor medios-fila">
              <p>Me han entrevistado en</p>
              <ul>
                {medios.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* RESULTADOS */}
        <section className="resultados" aria-labelledby="titulo-resultados">
          <div className="contenedor">
            <div className="resultados-encabezado">
              <h2 id="titulo-resultados">Lo que pasó en los negocios que dirigí</h2>
              <p>
                No vengo de la teoría: estos son resultados de empresas donde fui gerente o director.
              </p>
            </div>
            <div className="libro" role="table" aria-label="Resultados por empresa">
              <div className="libro-fila libro-cabeza" role="row">
                <span role="columnheader">Empresa</span>
                <span role="columnheader">Indicador</span>
                <span role="columnheader" className="num">Antes</span>
                <span role="columnheader" className="num">Después</span>
                <span role="columnheader" className="num">Plazo</span>
              </div>
              {resultados.map((r) => (
                <div className="libro-fila" role="row" key={r.empresa + r.indicador}>
                  <span role="cell" className="libro-empresa">
                    <strong>{r.empresa}</strong>
                    <small>{r.rubro}</small>
                  </span>
                  <span role="cell">{r.indicador}</span>
                  <span role="cell" className="num libro-antes">
                    {r.antes || '—'}
                  </span>
                  <span role="cell" className="num libro-despues">
                    {r.despues}
                  </span>
                  <span role="cell" className="num libro-plazo">
                    {r.plazo}
                  </span>
                </div>
              ))}
            </div>
            <ul className="cifras">
              {cifras.map((c) => (
                <li key={c.texto}>
                  <span className="cifra-valor">{c.valor}</span>
                  <span className="cifra-texto">{c.texto}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SERVICIOS */}
        <section id="servicios" className="servicios" aria-labelledby="titulo-servicios">
          <div className="contenedor servicios-grilla">
            <div className="servicios-intro">
              <h2 id="titulo-servicios">¿Qué necesita tu negocio?</h2>
              <p>Elige según lo que quieres lograr. Si no sabes por dónde partir, parte por el Diagnóstico Pyme.</p>
              <Image
                src="/fotos/servicios-azul-frontal.jpg"
                alt="Nico Pacheco sentado a la mesa, de frente"
                width={1800}
                height={1553}
                sizes="(max-width: 860px) 100vw, 360px"
                className="servicios-foto"
              />
            </div>
            <div className="servicios-lista">
              {servicios.map((grupo) => (
                <div className="grupo" key={grupo.id} id={grupo.id}>
                  <h3>{grupo.necesidad}</h3>
                  <ul>
                    {grupo.items.map((s) => (
                      <li key={s.id} className="servicio">
                        <div>
                          <h4>{s.nombre}</h4>
                          <p>{s.detalle}</p>
                        </div>
                        <div className="servicio-accion">
                          <span className="precio">{s.precio}</span>
                          <a href={s.href ?? contacto(s.id)} className="btn btn-oscuro btn-chico">
                            {s.accion}
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TIENDA */}
        <section id="tienda" className="tienda" aria-labelledby="titulo-tienda">
          <div className="contenedor">
            <div className="tienda-encabezado">
              <h2 id="titulo-tienda">Tienda</h2>
              <p>Herramientas para ordenar los números de tu negocio desde hoy. Compras por WhatsApp y pagas con Mercado Pago.</p>
            </div>
            <ul className="productos">
              {tienda.map((p) => (
                <li key={p.id} className="producto">
                  <h3>{p.nombre}</h3>
                  <p>{p.detalle}</p>
                  <div className="producto-pie">
                    <span className="precio precio-grande">{p.precio}</span>
                    <a
                      href={wa(`Hola Nico, quiero comprar: ${p.nombre} (${p.precio}).`)}
                      className="btn btn-verde btn-chico"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Comprar
                    </a>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="regalo">
              <div>
                <h3>Planilla de flujo de caja, gratis</h3>
                <p>La misma que uso para partir cualquier diagnóstico. Te la envío a tu correo.</p>
              </div>
              <a href={contacto('planilla-gratis')} className="btn btn-oscuro">
                Quiero la planilla
              </a>
            </aside>
          </div>
        </section>

        {/* CONFERENCIAS Y SEMINARIOS */}
        <section id="conferencias" className="conferencias" aria-labelledby="titulo-conferencias">
          <div className="conferencias-foto">
            <Image
              src="/fotos/conferencias/duoc-arauco-auditorio-lleno.jpg"
              alt="Nico Pacheco dando una conferencia ante un auditorio lleno en Duoc UC Campus Arauco"
              fill
              sizes="100vw"
            />
            <p className="pie-foto">Duoc UC Campus Arauco, 2023</p>
          </div>
          <div className="contenedor conferencias-grilla">
            <div>
              <h2 id="titulo-conferencias">Conferencias y seminarios</h2>
              <p className="conferencias-bajada">
                Más de 50 conferencias en 10 años, en Chile, México, Argentina y Perú. Charlas con
                historias reales de negocios, pensadas para que el público salga con un plan.
              </p>
              <ul className="charlas">
                {charlas.map((c) => (
                  <li key={c.titulo}>
                    <h3>{c.titulo}</h3>
                    <p>{c.detalle}</p>
                  </li>
                ))}
              </ul>
              <a href={contacto('conferencia')} className="btn btn-verde">
                Cotizar una conferencia
              </a>
            </div>
            <div className="seminarios">
              <h3>Seminarios para dueños de pymes</h3>
              <p>
                Tres veces al año organizo un seminario presencial para dueños de pymes: una jornada
                de finanzas, ventas y crecimiento, con casos reales.
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
              <p className="seminarios-nota">Las próximas fechas se anuncian aquí y en el podcast.</p>
              <a href={contacto('seminario')} className="btn btn-linea-clara">
                Avísame de la preventa
              </a>
            </div>
          </div>
        </section>

        {/* PODCAST */}
        <section id="podcast" className="podcast" aria-labelledby="titulo-podcast">
          <div className="contenedor podcast-grilla">
            <Image
              src="/fotos/podcast-cafe-pensativo.jpg"
              alt="Nico Pacheco pensativo, con la mano en el mentón"
              width={1800}
              height={1200}
              sizes="(max-width: 860px) 100vw, 50vw"
              className="podcast-foto"
            />
            <div>
              <h2 id="titulo-podcast">EmprendeBien, el podcast</h2>
              <p>
                Conversaciones con dueños de negocios sobre lo que de verdad pasa al emprender: los
                números, los errores y las decisiones que hacen crecer una empresa.
              </p>
              <p className="podcast-estado">El primer episodio se estrena pronto en YouTube.</p>
              <a href={contacto('podcast')} className="btn btn-oscuro">
                Avísame del estreno
              </a>
            </div>
          </div>
        </section>

        {/* SOBRE MÍ */}
        <section id="sobre-mi" className="sobre" aria-labelledby="titulo-sobre">
          <div className="contenedor sobre-grilla">
            <div className="sobre-texto">
              <h2 id="titulo-sobre">Sobre mí</h2>
              <p className="sobre-lead">
                Soy Maximiliano Pacheco, Nico para todos. Llevo 14 años dirigiendo y dando vuelta
                negocios reales en gastronomía, hotelería y turismo.
              </p>
              <p>
                Rescaté un hotel con pérdidas, convertí un hostal en un grupo de turismo y llevé una
                cadena de comida rápida saludable a 14 franquicias. Hoy soy director en siete
                empresas, dirijo el programa Directorio PYME y escribo sobre emprendimiento en el
                Diario El Llanquihue.
              </p>
              <p>
                Tengo un MBA de la Universidad Europea de Madrid y un Mágister en Dirección
                Comercial, Marketing e Innovación de la Universidad Andrés Bello, y curso una
                Maestría en Economía.
              </p>
              <a href={LINKEDIN} className="enlace" target="_blank" rel="noopener noreferrer">
                Ver mi perfil en LinkedIn
              </a>
            </div>
            <Image
              src="/fotos/sobre-mi-azul-mesa.jpg"
              alt="Nico Pacheco apoyado en una mesa, sonriendo"
              width={1800}
              height={1617}
              sizes="(max-width: 860px) 100vw, 45vw"
              className="sobre-foto"
            />
          </div>

          <div className="contenedor">
            <h3 className="subtitulo">Trayectoria</h3>
            <ol className="linea-tiempo">
              {trayectoria.map((t) => (
                <li key={t.periodo + t.lugar}>
                  <span className="periodo">{t.periodo}</span>
                  <span className="cargo">{t.cargo}</span>
                  <span className="lugar">{t.lugar}</span>
                </li>
              ))}
            </ol>

            <h3 className="subtitulo">En los medios</h3>
            <ul className="prensa">
              {prensa.map((p) => (
                <li key={p.src}>
                  <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="(max-width: 600px) 50vw, 220px" />
                  <span>{p.medio}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CONTACTO */}
        <section id="contacto" className="contacto" aria-labelledby="titulo-contacto">
          <div className="contenedor contacto-grilla">
            <div>
              <h2 id="titulo-contacto">Hablemos de tu negocio</h2>
              <p>
                Cuéntame en qué estás y te respondo personalmente con el siguiente paso. Para
                conferencias, indica ciudad, fecha y tamaño del público.
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
          <p>Nico Pacheco, Puerto Varas, Chile</p>
          <nav aria-label="Pie de página">
            {nav.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href={wa('Hola Nico, vengo de nicopacheco.cl.')} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
