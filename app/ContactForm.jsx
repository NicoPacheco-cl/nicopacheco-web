'use client';

import { useEffect, useState } from 'react';
import { intereses, CORREO } from './data';

export default function ContactForm() {
  const [interes, setInteres] = useState('diagnostico');
  const [enviado, setEnviado] = useState(false);

  // Preselecciona el tema cuando se llega desde un botón (?interes=...)
  useEffect(() => {
    const leer = () => {
      const valor = new URLSearchParams(window.location.search).get('interes');
      if (valor && intereses.some((i) => i.value === valor)) setInteres(valor);
    };
    leer();
    window.addEventListener('popstate', leer);
    window.addEventListener('hashchange', leer);
    return () => {
      window.removeEventListener('popstate', leer);
      window.removeEventListener('hashchange', leer);
    };
  }, []);

  function enviar(e) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const tema = intereses.find((i) => i.value === datos.get('interes'))?.label ?? 'Contacto';
    const cuerpo = [
      `Nombre: ${datos.get('nombre')}`,
      `Correo: ${datos.get('correo')}`,
      datos.get('empresa') ? `Empresa: ${datos.get('empresa')}` : null,
      '',
      datos.get('mensaje'),
    ]
      .filter((l) => l !== null)
      .join('\n');
    window.location.href = `mailto:${CORREO}?subject=${encodeURIComponent(
      `${tema} · nicopacheco.cl`
    )}&body=${encodeURIComponent(cuerpo)}`;
    setEnviado(true);
  }

  return (
    <form className="form" onSubmit={enviar}>
      <div className="form-fila">
        <label className="campo">
          <span>Nombre</span>
          <input name="nombre" required autoComplete="name" />
        </label>
        <label className="campo">
          <span>Correo</span>
          <input name="correo" type="email" required autoComplete="email" />
        </label>
      </div>
      <div className="form-fila">
        <label className="campo">
          <span>Empresa o negocio (opcional)</span>
          <input name="empresa" autoComplete="organization" />
        </label>
        <label className="campo">
          <span>¿En qué te ayudo?</span>
          <select name="interes" value={interes} onChange={(e) => setInteres(e.target.value)}>
            {intereses.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="campo">
        <span>Cuéntame de tu negocio</span>
        <textarea name="mensaje" rows={5} required />
      </label>
      <button type="submit" className="btn btn-verde">
        Enviar mensaje
      </button>
      {enviado && (
        <p className="form-nota" role="status">
          Se abrió tu correo con el mensaje listo. Si no se abrió, escríbeme a {CORREO}.
        </p>
      )}
    </form>
  );
}
