'use client';

import { useState } from 'react';

const REGIONES = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "Libertador General Bernardo O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
];

const PRECIOS = { fisico: 14990, digital: 7990 };
const pesos = (n) => `$${n.toLocaleString('es-CL')}`;

export default function LibroCompra() {
  const [formato, setFormato] = useState('fisico');
  const [cantidad, setCantidad] = useState(1);
  const [entrega, setEntrega] = useState('despacho');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const total = PRECIOS[formato] * (formato === 'fisico' ? cantidad : 1);

  async function pagar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    const datos = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch('/api/libro/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datos, formato, cantidad, entrega, acepta: datos.acepta === 'on' }),
      });
      const res = await r.json();
      if (!r.ok || !res.url) throw new Error(res.error || 'No pudimos iniciar el pago.');
      window.location.href = res.url;
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <form className="lc" onSubmit={pagar}>
      <h3 className="lc-titulo">Compra tu libro</h3>

      <div className="lc-opciones" role="radiogroup" aria-label="Formato del libro">
        <label className={formato === 'fisico' ? 'lc-opcion activa' : 'lc-opcion'}>
          <input type="radio" name="formato-ui" checked={formato === 'fisico'} onChange={() => setFormato('fisico')} />
          <span className="lc-op-nombre">Libro físico</span>
          <span className="lb-pill lc-pill">PREVENTA</span>
          <span className="lc-op-precio">
            <s>$29.990</s> <strong>$14.990</strong>
          </span>
          <span className="lc-op-nota">Despacho a todo Chile o retiro gratis</span>
        </label>
        <label className={formato === 'digital' ? 'lc-opcion activa' : 'lc-opcion'}>
          <input type="radio" name="formato-ui" checked={formato === 'digital'} onChange={() => setFormato('digital')} />
          <span className="lc-op-nombre">Libro digital</span>
          <span className="lc-op-precio">
            <strong>$7.990</strong>
          </span>
          <span className="lc-op-nota">Kindle, Apple Books y PDF · descarga inmediata</span>
        </label>
      </div>

      <div className="lc-fila lc-fila-3">
        <label className="lc-campo">
          <span>Nombre</span>
          <input name="nombre" required autoComplete="name" />
        </label>
        <label className="lc-campo">
          <span>Correo</span>
          <input name="correo" type="email" required autoComplete="email" />
        </label>
        <label className="lc-campo">
          <span>Teléfono</span>
          <input name="telefono" type="tel" placeholder="+56 9 1234 5678" required={formato === 'fisico'} autoComplete="tel" />
        </label>
      </div>

      {formato === 'fisico' && (
        <>
          <label className="lc-campo lc-cantidad">
            <span>Cantidad</span>
            <select value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 10].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'ejemplar' : 'ejemplares'}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="lc-entrega">
            <legend>¿Cómo lo recibes?</legend>
            {[
              ['despacho', 'Despacho por Blue Express', 'A cualquier región de Chile. El envío se paga al recibir (por pagar).'],
              ['retiro_puerto_montt', 'Retiro gratis en Puerto Montt', 'Te escribimos para coordinar el día y el lugar.'],
              ['retiro_puerto_varas', 'Retiro gratis en Puerto Varas', 'Te escribimos para coordinar el día y el lugar.'],
            ].map(([valor, titulo, nota]) => (
              <label key={valor} className={entrega === valor ? 'lc-op-entrega activa' : 'lc-op-entrega'}>
                <input type="radio" name="entrega-ui" checked={entrega === valor} onChange={() => setEntrega(valor)} />
                <span>
                  <strong>{titulo}</strong>
                  <small>{nota}</small>
                </span>
              </label>
            ))}

            {entrega === 'despacho' && (
              <>
                <label className="lc-campo">
                  <span>Dirección</span>
                  <input name="direccion" placeholder="Calle, número, depto." required autoComplete="street-address" />
                </label>
                <div className="lc-fila lc-fila-3">
                  <label className="lc-campo">
                    <span>Comuna</span>
                    <input name="comuna" required autoComplete="address-level2" />
                  </label>
                  <label className="lc-campo">
                    <span>Región</span>
                    <select name="region" required defaultValue="">
                      <option value="" disabled>
                        Elige la región
                      </option>
                      {REGIONES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <label className="lc-campo">
                    <span>RUT (para Blue Express, opcional)</span>
                    <input name="rut" placeholder="12.345.678-9" />
                  </label>
                </div>
              </>
            )}
            <label className="lc-campo">
              <span>Notas para la entrega (opcional)</span>
              <textarea name="notas" rows={2} />
            </label>
          </fieldset>
        </>
      )}

      <label className="lc-acepto">
        <input type="checkbox" name="acepta" required />
        <span>Acepto que Nico Pacheco use mis datos para procesar la compra y coordinar la entrega.</span>
      </label>

      {error && (
        <p className="lc-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="lb-btn lc-pagar" disabled={enviando}>
        {enviando ? 'Abriendo Mercado Pago…' : `Pagar ${pesos(total)} con Mercado Pago`}
      </button>
    </form>
  );
}
