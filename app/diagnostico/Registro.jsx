'use client';

import { useEffect, useState } from 'react';
import { CORREO } from '../data';

// Antes de abrir el diagnóstico gratis se piden nombre, correo y teléfono.
// Los montos del diagnóstico siguen guardándose solo en el navegador del visitante.
const CLAVE = 'np_diag_registro_v1';

export default function Registro({ children }) {
  const [estado, setEstado] = useState('cargando'); // cargando | pedir | listo
  const [datos, setDatos] = useState({ nombre: '', correo: '', telefono: '' });
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [aceptaNovedades, setAceptaNovedades] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let registrado = false;
    try {
      registrado = Boolean(localStorage.getItem(CLAVE));
    } catch {}
    setEstado(registrado ? 'listo' : 'pedir');
  }, []);

  const cambiar = (campo) => (e) => setDatos((d) => ({ ...d, [campo]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    if (!aceptaDatos) {
      setError('Para continuar, marca la autorización de uso de tus datos.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const r = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datos, origen: 'diagnostico', aceptaDatos, aceptaNovedades }),
      });
      const res = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(res.error || 'No pudimos guardar tus datos. Inténtalo de nuevo.');
      try {
        localStorage.setItem(CLAVE, new Date().toISOString());
      } catch {}
      setEstado('listo');
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (estado === 'cargando') return <div className="dp-reg-espera" aria-busy="true" />;
  if (estado === 'listo') return children;

  return (
    <form className="dp-reg" onSubmit={enviar} noValidate={false}>
      <div className="dp-reg-cab">
        <p className="dp-reg-rotulo">Antes de empezar</p>
        <h2>¿A quién le preparo este diagnóstico?</h2>
        <p>
          Déjame tus datos y entra al diagnóstico. Tus números no se envían a nadie: quedan solo en
          este navegador. Al final descargas tu estado de resultados en PDF.
        </p>
      </div>
      <div className="dp-reg-campos">
        <label>
          <span>Nombre</span>
          <input className="dp-txt" name="nombre" required minLength={2} autoComplete="name" value={datos.nombre} onChange={cambiar('nombre')} />
        </label>
        <label>
          <span>Correo</span>
          <input className="dp-txt" name="correo" type="email" required autoComplete="email" value={datos.correo} onChange={cambiar('correo')} />
        </label>
        <label>
          <span>Teléfono</span>
          <input className="dp-txt" name="telefono" type="tel" required minLength={8} autoComplete="tel" placeholder="+56 9 1234 5678" value={datos.telefono} onChange={cambiar('telefono')} />
        </label>
      </div>
      <div className="dp-reg-casillas">
        <label>
          <input type="checkbox" checked={aceptaDatos} onChange={(e) => setAceptaDatos(e.target.checked)} />
          <span>
            Autorizo a Nico Pacheco a guardar mi nombre, correo y teléfono para contactarme sobre este
            diagnóstico. Puedo pedir que se borren escribiendo a {CORREO}.
          </span>
        </label>
        <label className="opcional">
          <input type="checkbox" checked={aceptaNovedades} onChange={(e) => setAceptaNovedades(e.target.checked)} />
          <span>Opcional: quiero recibir La Bitácora Pyme, un correo al mes.</span>
        </label>
      </div>
      {error && <p className="dp-reg-error" role="alert">{error}</p>}
      <button type="submit" className="dp-reg-btn" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Empezar mi diagnóstico'}
      </button>
    </form>
  );
}
