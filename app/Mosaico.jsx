'use client';

import { useEffect, useRef, useState } from 'react';
import PagoServicio from './PagoServicio';

const contacto = (interes) => `?interes=${interes}#contacto`;

function Flecha() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function Celda({ m }) {
  return (
    <>
      <span className="mosaico-marca" aria-hidden="true">
        {m.marca}
      </span>
      <span className="mosaico-flecha" aria-hidden="true">
        <Flecha />
      </span>
      <span className={m.titulo.length > 22 ? 'mosaico-titulo mosaico-titulo-largo' : 'mosaico-titulo'}>{m.titulo}</span>
      <span className="mosaico-etiqueta">{m.etiqueta}</span>
    </>
  );
}

function Ficha({ ficha }) {
  const { sesiones, testimonio, informe } = ficha;
  return (
    <div className="ficha">
      {sesiones?.length > 0 && (
        <section aria-labelledby="ficha-sesiones">
          <h4 id="ficha-sesiones" className="ficha-rotulo">
            Cómo funciona
          </h4>
          <ol className="ficha-sesiones">
            {sesiones.map((m, n) => (
              <li key={m.titulo} className="ficha-sesion">
                <p className="ficha-numero">
                  Sesión {n + 1} <span>{m.duracion}</span>
                </p>
                <h5>{m.titulo}</h5>
                <p>{m.bajada}</p>
                <ul>
                  {m.puntos.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}
      {testimonio &&
        (testimonio.youtube ? (
          <iframe
            className="ficha-video ficha-video-vertical"
            src={`https://www.youtube-nocookie.com/embed/${testimonio.youtube}`}
            title={testimonio.rotulo}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : testimonio.video ? (
          <video className="ficha-video" src={testimonio.video} controls preload="metadata" aria-label={testimonio.rotulo} />
        ) : (
          <div className="ficha-video ficha-video-vacio" role="img" aria-label={testimonio.rotulo}>
            <span className="ficha-play" aria-hidden="true" />
            <span>{testimonio.rotulo}</span>
          </div>
        ))}
      {informe &&
        (informe.href ? (
          <a href={informe.href} className="btn btn-linea-clara ficha-informe" target="_blank" rel="noopener noreferrer">
            {informe.etiqueta}
          </a>
        ) : (
          <button type="button" className="btn btn-linea-clara ficha-informe">
            {informe.etiqueta}
          </button>
        ))}
    </div>
  );
}

export default function Mosaico({ items }) {
  const [abierto, setAbierto] = useState(null);
  const dialogo = useRef(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  // Permite llegar con la ficha abierta desde otra página (?servicio=id).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('servicio');
    if (id && items.some((i) => i.id === id && !i.ficha?.directo)) setAbierto(id);
    // Solo al abrir la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = items.find((i) => i.id === abierto);

  return (
    <>
      <ul className="mosaico">
        {items.map((i) => (
          <li key={i.id} id={i.id}>
            {i.ficha?.directo ? (
              <a className="mosaico-celda" style={{ '--fondo': i.mosaico.fondo }} href={i.href}>
                <Celda m={i.mosaico} />
              </a>
            ) : (
              <button
                type="button"
                className="mosaico-celda"
                style={{ '--fondo': i.mosaico.fondo }}
                onClick={() => setAbierto(i.id)}
                aria-haspopup="dialog"
              >
                <Celda m={i.mosaico} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogo}
        className="detalle"
        onClose={() => setAbierto(null)}
        onClick={(e) => {
          if (e.target === dialogo.current) setAbierto(null);
        }}
        aria-labelledby="detalle-titulo"
      >
        {s && (
          <div className="detalle-cuerpo">
            <button type="button" className="detalle-cerrar" onClick={() => setAbierto(null)} aria-label="Cerrar">
              ×
            </button>
            <p className="detalle-etiqueta">{s.mosaico.etiqueta}</p>
            <h3 id="detalle-titulo" className="detalle-titulo">
              {s.nombre}
            </h3>
            <p className="detalle-resena">{s.resena}</p>
            <div className="detalle-importa">
              <span>Por qué importa</span>
              <p>{s.importancia}</p>
            </div>
            {s.ficha && <Ficha ficha={s.ficha} />}
            {s.opciones?.length ? (
              <div className="detalle-pago">
                <PagoServicio key={s.id} opciones={s.opciones} />
              </div>
            ) : (
              <div className="detalle-pie">
                <div>
                  <span className="detalle-precio-rotulo">Valor</span>
                  <span className="detalle-precio">{s.precio}</span>
                </div>
                <a href={s.href ?? contacto(s.id)} className="btn btn-blanco" onClick={() => setAbierto(null)}>
                  {s.accion}
                </a>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
