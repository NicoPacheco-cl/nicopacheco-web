'use client';

import { useState } from 'react';
import CampoCodigo from './CampoCodigo';

const pesos = (n) => `$${Number(n).toLocaleString('es-CL')}`;

// Formulario corto para pagar un programa con Mercado Pago desde la ventana de detalle.
export default function PagoServicio({ opciones }) {
  const [elegida, setElegida] = useState(opciones[0].id);
  const [descuento, setDescuento] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const op = opciones.find((o) => o.id === elegida);
  const total = descuento ? descuento.total : op.precio;

  async function pagar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    const datos = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch('/api/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datos, producto: elegida, codigo: descuento?.codigo, acepta: datos.acepta === 'on' }),
      });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || 'No pudimos iniciar el pago.');
      window.location.href = j.url;
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <form className="ps" onSubmit={pagar}>
      {opciones.length > 1 && (
        <div className="ps-opciones" role="radiogroup" aria-label="Elige una opción">
          {opciones.map((o) => (
            <label key={o.id} className={o.id === elegida ? 'ps-opcion activa' : 'ps-opcion'}>
              <input
                type="radio"
                name="opcion"
                checked={o.id === elegida}
                onChange={() => {
                  setElegida(o.id);
                  setDescuento(null);
                }}
              />
              <span>{o.texto}</span>
            </label>
          ))}
        </div>
      )}
      <div className="ps-campos">
        <input name="nombre" placeholder="Nombre" required autoComplete="name" aria-label="Nombre" />
        <input name="correo" type="email" placeholder="Correo" required autoComplete="email" aria-label="Correo" />
        <input name="telefono" type="tel" placeholder="Teléfono" required autoComplete="tel" aria-label="Teléfono" />
        <input name="empresa" placeholder="Empresa (opcional)" autoComplete="organization" aria-label="Empresa" />
      </div>
      <CampoCodigo key={elegida} productoId={elegida} onCambio={setDescuento} />
      <label className="ps-acepto">
        <input type="checkbox" name="acepta" required />
        <span>Acepto que Nico Pacheco use mis datos para agendar y prestar el servicio.</span>
      </label>
      {error && (
        <p className="ps-error" role="alert">
          {error}
        </p>
      )}
      <div className="ps-pie">
        <div>
          <span className="detalle-precio-rotulo">Total</span>
          <span className="detalle-precio">
            {descuento && <s className="ps-antes">{pesos(op.precio)}</s>} {pesos(total)}
          </span>
        </div>
        <button type="submit" className="btn btn-blanco" disabled={enviando}>
          {enviando ? 'Abriendo Mercado Pago…' : op.accion}
        </button>
      </div>
      <p className="ps-nota">Pagas con Mercado Pago. Después del pago te contactamos para agendar.</p>
    </form>
  );
}
