import Image from 'next/image';
import ContactForm from './ContactForm';
import {
  nav,
  respaldo,
  problemas,
  servicios,
  pasos,
  tienda,
  charlas,
  entradas,
  trayectoria,
  medios,
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
              <h1>Tu pyme puede ganar más, valer más y venderse mejor.</h1>
              <p className="portada-bajada">
                Mentoring, finanzas y estrategia para dueños de negocios en Chile, con
                especialidad en gastronomía, compraventa de negocios y franquicias.
              </p>
              <div className="botones">
                <a href={contacto('diagnostico')} className="btn btn-verde">
                  Agenda tu Diagnóstico Pyme
                </a>
                <a href={contacto('planilla-gratis')} className="btn btn-linea">
                  Pide gratis la planilla de flujo de caja
                </a>
              </div>
            </div>
            <div className="portada-foto">
              <Image
                src="/fotos/recortes/nico-brazos-cruzados.png"
                alt="Nico Pacheco, mentor de pymes"
                width={1067}
                height={1600}
                priority
                sizes="(max-width: 860px) 60vw, 380px"
              />
            </div>
          </div>
          <div className="respaldo">
            <ul className="contenedor">
              {respaldo.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* PROBLEMAS */}
        <section className="problemas" aria-labelledby="titulo-problemas">
          <div className="contenedor">
            <h2 id="titulo-problemas">¿Te suena alguna de estas?</h2>
            <ul className="problemas-lista">
              {problemas.map((p) => (
                <li key={p.frase}>
                  <p className="problema-frase">{p.frase}</p>
                  <p className="problema-respuesta">{p.respuesta}</p>
                  <a href={p.href} className="enlace">
                    {p.accion}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SERVICIOS */}
        <section id="servicios" className="servicios" aria-labelledby="titulo-servicios">
          <div className="contenedor">
            <div className="encabezado">
              <h2 id="titulo-servicios">Servicios</h2>
              <p>Elige según lo que quieres lograr. Si no sabes por dónde partir, parte por el Diagnóstico Pyme.</p>
            </div>
            {servicios.map((grupo) => (
              <div className="grupo" key={grupo.id}>
                <h3 className="grupo-titulo">{grupo.necesidad}</h3>
                <ul className="tarjetas">
                  {grupo.items.map((s) => (
                    <li key={s.id} id={s.id} className={s.destacado ? 'tarjeta tarjeta-destacada' : 'tarjeta'}>
                      <h4>{s.nombre}</h4>
                      <p className="tarjeta-resena">{s.resena}</p>
                      <div className="tarjeta-importancia">
                        <span>Por qué importa</span>
                        <p>{s.importancia}</p>
                      </div>
                      <div className="tarjeta-pie">
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
        </section>

        {/* CÓMO TRABAJAMOS */}
        <section className="pasos" aria-labelledby="titulo-pasos">
          <div className="contenedor">
            <h2 id="titulo-pasos">Cómo trabajamos</h2>
            <ol className="pasos-lista">
              {pasos.map((p) => (
                <li key={p.titulo}>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* TIENDA */}
        <section id="tienda" className="tienda" aria-labelledby="titulo-tienda">
          <div className="contenedor">
            <div className="encabezado">
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
                <p>Para que veas mes a mes cuánta plata entra, cuánta sale y cuánta te queda.</p>
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
              alt="Conferencia ante un auditorio lleno en Duoc UC Campus Arauco"
              fill
              sizes="100vw"
            />
            <p className="pie-foto">Duoc UC Campus Arauco, 2023</p>
          </div>
          <div className="contenedor conferencias-grilla">
            <div>
              <h2 id="titulo-conferencias">Conferencias y seminarios</h2>
              <p className="conferencias-bajada">
                Charlas para empresas, universidades y gremios, con historias reales de negocios,
                pensadas para que el público salga con un plan.
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
                Tres veces al año: una jornada presencial de finanzas, ventas y crecimiento, con
                casos reales y tiempo para tus preguntas.
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
          <div className="contenedor podcast-caja">
            <div>
              <p className="podcast-nombre" aria-hidden="true">EmprendeBien</p>
              <h2 id="titulo-podcast">El podcast para emprender con los números claros</h2>
            </div>
            <div>
              <p>
                Conversaciones con dueños de negocios sobre lo que de verdad pasa al emprender: los
                números, los errores y las decisiones que hacen crecer una empresa.
              </p>
              <p className="podcast-estado">El primer episodio se estrena pronto en YouTube.</p>
              <a href={contacto('podcast')} className="btn btn-claro">
                Avísame del estreno
              </a>
            </div>
          </div>
        </section>

        {/* SOBRE NICO */}
        <section id="sobre-nico" className="sobre" aria-labelledby="titulo-sobre">
          <div className="contenedor sobre-grilla">
            <div className="sobre-foto">
              <Image
                src="/fotos/recortes/nico-sentado.png"
                alt="Nico Pacheco sentado, con chaqueta azul de terciopelo"
                width={1100}
                height={1482}
                sizes="(max-width: 860px) 60vw, 300px"
              />
            </div>
            <div className="sobre-texto">
              <h2 id="titulo-sobre">Sobre Nico</h2>
              <p>
                Maximiliano “Nico” Pacheco es director de empresas, mentor y conferencista. Ha
                dirigido negocios de gastronomía, hotelería y turismo en el sur de Chile, y llevó
                una cadena de comida rápida saludable a 14 franquicias.
              </p>
              <p>
                Tiene un MBA de la Universidad Europea de Madrid y un Mágister en Dirección
                Comercial, Marketing e Innovación de la Universidad Andrés Bello.
              </p>
              <p className="sobre-medios">
                Ha sido entrevistado en {medios.slice(0, -1).join(', ')} y {medios.at(-1)}.
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

        {/* CONTACTO */}
        <section id="contacto" className="contacto" aria-labelledby="titulo-contacto">
          <div className="contenedor contacto-grilla">
            <div>
              <h2 id="titulo-contacto">Hablemos de tu negocio</h2>
              <p>
                Cuéntame en qué estás y te respondo con el siguiente paso. Para conferencias,
                indica ciudad, fecha y tamaño del público.
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
