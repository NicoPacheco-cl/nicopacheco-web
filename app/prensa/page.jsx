import Image from 'next/image';
import Copiar from './Copiar';
import { prensa, charlas, medios, CORREO, LINKEDIN, wa } from '../data';

export const metadata = {
  title: 'Prensa · Nico Pacheco',
  description:
    'Kit de prensa de Nico Pacheco: biografía, fotos en alta resolución, temas de entrevista y charla, y datos del libro Franquicia Justa.',
};

export default function Prensa() {
  const bioLargaTexto = prensa.bioLarga.join('\n\n');
  return (
    <>
      <header className="cabecera">
        <div className="contenedor cabecera-fila">
          <a href="/" className="marca">
            NICO PACHECO<sup>®</sup>
          </a>
          <a href="#contacto-prensa" className="btn btn-blanco btn-chico" style={{ marginLeft: 'auto' }}>
            Contacto de prensa
          </a>
        </div>
      </header>

      <main className="pk" id="contenido">
        <section className="pk-portada">
          <div className="contenedor pk-portada-grilla">
            <div>
              <p className="pk-rotulo">Kit de prensa</p>
              <h1 className="pk-titulo">Nico Pacheco</h1>
              <p className="pk-bajada">
                Empresario, director de empresas y autor de <em>Franquicia Justa</em>. Todo lo que
                necesitas para una nota, una entrevista o la presentación de una charla.
              </p>
              <dl className="pk-datos">
                <div>
                  <dt>Nombre público</dt>
                  <dd>{prensa.nombre}</dd>
                </div>
                <div>
                  <dt>Nombre legal y de autor</dt>
                  <dd>{prensa.nombreLegal}</dd>
                </div>
                <div>
                  <dt>Base</dt>
                  <dd>{prensa.ciudad}</dd>
                </div>
              </dl>
            </div>
            <div className="pk-portada-foto">
              <Image
                src="/fotos/recortes/nico-brazos-cruzados.png"
                alt="Nico Pacheco de brazos cruzados"
                width={1067}
                height={1600}
                priority
                sizes="(max-width: 860px) 70vw, 420px"
              />
            </div>
          </div>
        </section>

        <section className="pk-bloque" aria-labelledby="pk-bios">
          <div className="contenedor">
            <h2 id="pk-bios" className="pk-h2">Biografía</h2>
            <article className="pk-tarjeta">
              <div className="pk-tarjeta-cab">
                <h3>Versión corta</h3>
                <Copiar texto={prensa.bioCorta} />
              </div>
              <p>{prensa.bioCorta}</p>
            </article>
            <article className="pk-tarjeta">
              <div className="pk-tarjeta-cab">
                <h3>Versión extendida</h3>
                <Copiar texto={bioLargaTexto} />
              </div>
              {prensa.bioLarga.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </article>
          </div>
        </section>

        <section className="pk-bloque pk-hueso" aria-labelledby="pk-fotos">
          <div className="contenedor">
            <h2 id="pk-fotos" className="pk-h2">Fotos en alta resolución</h2>
            <p className="pk-nota">Uso libre para notas de prensa y difusión de charlas, citando a Nico Pacheco.</p>
            <ul className="pk-fotos">
              {prensa.fotos.map((f) => (
                <li key={f.archivo}>
                  <a href={f.archivo} download>
                    <span className="pk-foto-marco">
                      <Image src={f.archivo} alt={f.titulo} fill sizes="(max-width: 700px) 50vw, 360px" />
                    </span>
                    <span className="pk-foto-pie">
                      {f.titulo} <span aria-hidden="true">↓</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="pk-bloque" aria-labelledby="pk-libro">
          <div className="contenedor pk-libro">
            <div className="pk-libro-portada">
              <Image
                src="/fotos/libro/franquicia-justa-portada.jpg"
                alt="Portada del libro Franquicia Justa"
                width={900}
                height={1350}
                sizes="(max-width: 860px) 60vw, 300px"
              />
            </div>
            <div>
              <h2 id="pk-libro" className="pk-h2">El libro</h2>
              <p className="pk-libro-titulo">{prensa.libro.titulo}</p>
              <p className="pk-libro-sub">{prensa.libro.subtitulo}</p>
              <p>{prensa.libro.detalle}</p>
              <ul className="pk-lista-datos">
                {prensa.libro.datos.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <p className="pk-destacado">{prensa.libro.lanzamiento}</p>
              <a href="/#libro" className="enlace">
                Ver el libro en el sitio
              </a>
            </div>
          </div>
        </section>

        <section className="pk-bloque pk-hueso" aria-labelledby="pk-temas">
          <div className="contenedor pk-dos">
            <div>
              <h2 id="pk-temas" className="pk-h2">Charlas</h2>
              <ul className="pk-charlas">
                {charlas.map((c) => (
                  <li key={c.titulo}>
                    <h3>{c.titulo}</h3>
                    <p>{c.detalle}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="pk-h2">Temas de entrevista</h2>
              <ul className="pk-temas">
                {prensa.temasEntrevista.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="pk-bloque" aria-labelledby="pk-medios">
          <div className="contenedor">
            <h2 id="pk-medios" className="pk-h2">En los medios</h2>
            <ul className="pk-apariciones">
              {prensa.apariciones.map((a) => (
                <li key={a.titulo}>
                  <span className="pk-medio">{a.medio}</span>
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noopener noreferrer">
                      {a.titulo}
                    </a>
                  ) : (
                    <span>{a.titulo}</span>
                  )}
                  <span className="pk-fecha">{a.fecha}</span>
                </li>
              ))}
            </ul>
            <p className="pk-nota">También ha sido entrevistado en {medios.filter((m) => !prensa.apariciones.some((a) => a.medio === m)).join(', ')}.</p>
          </div>
        </section>

        <section id="contacto-prensa" className="pk-bloque pk-oscuro" aria-labelledby="pk-contacto">
          <div className="contenedor">
            <h2 id="pk-contacto" className="pk-h2">Contacto de prensa y eventos</h2>
            <p>Para entrevistas, notas o charlas, escribe con el medio, el tema y la fecha.</p>
            <div className="botones">
              <a href={`mailto:${CORREO}?subject=${encodeURIComponent('Prensa · Nico Pacheco')}`} className="btn btn-blanco">
                {CORREO}
              </a>
              <a href={wa('Hola Nico, te escribo por una entrevista o nota de prensa.')} className="btn btn-linea-clara" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              <a href={LINKEDIN} className="btn btn-linea-clara" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="pie">
        <div className="contenedor pie-fila">
          <p className="pie-marca">NICO PACHECO®</p>
          <nav aria-label="Pie de página">
            <a href="/">Inicio</a>
            <a href="/#libro">Libro</a>
            <a href="/#eventos">Conferencias</a>
          </nav>
          <p className="pie-lugar">Puerto Varas, Chile</p>
        </div>
      </footer>
    </>
  );
}
