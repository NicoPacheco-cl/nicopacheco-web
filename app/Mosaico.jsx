'use client';

import { useEffect, useRef, useState } from 'react';

const contacto = (interes) => `?interes=${interes}#contacto`;

function Flecha() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
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

  const s = items.find((i) => i.id === abierto);

  return (
    <>
      <ul className="mosaico">
        {items.map((i) => (
          <li key={i.id} id={i.id}>
            <button
              type="button"
              className="mosaico-celda"
              style={{ '--fondo': i.mosaico.fondo }}
              onClick={() => setAbierto(i.id)}
              aria-haspopup="dialog"
            >
              <span className="mosaico-marca" aria-hidden="true">
                {i.mosaico.marca}
              </span>
              <span className="mosaico-flecha" aria-hidden="true">
                <Flecha />
              </span>
              <span className="mosaico-titulo">{i.mosaico.titulo}</span>
              <span className="mosaico-etiqueta">{i.mosaico.etiqueta}</span>
            </button>
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
            <div className="detalle-pie">
              <div>
                <span className="detalle-precio-rotulo">Valor</span>
                <span className="detalle-precio">{s.precio}</span>
              </div>
              <a href={s.href ?? contacto(s.id)} className="btn btn-blanco" onClick={() => setAbierto(null)}>
                {s.accion}
              </a>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
