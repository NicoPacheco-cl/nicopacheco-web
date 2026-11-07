'use client';

import { useState } from 'react';

export default function Copiar({ texto, etiqueta = 'Copiar' }) {
  const [hecho, setHecho] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setHecho(true);
      setTimeout(() => setHecho(false), 2000);
    } catch {}
  }
  return (
    <button type="button" className="pk-copiar" onClick={copiar} aria-live="polite">
      {hecho ? 'Copiado' : etiqueta}
    </button>
  );
}
