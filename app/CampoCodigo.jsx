'use client';

import { useState } from 'react';

const pesos = (n) => `$${Number(n).toLocaleString('es-CL')}`;

// Campo "¿Tienes un código de descuento?" que consulta el servidor y avisa el nuevo total.
export default function CampoCodigo({ productoId, cantidad = 1, onCambio, claro = false, ruta = '/api/codigo' }) {
  const [abierto, setAbierto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [estado, setEstado] = useState(null); // { ok, mensaje }
  const [cargando, setCargando] = useState(false);

  async function aplicar() {
    const c = codigo.trim().toUpperCase();
    if (!c) return;
    setCargando(true);
    try {
      const r = await fetch(`${ruta}?codigo=${encodeURIComponent(c)}&producto=${encodeURIComponent(productoId)}&cantidad=${cantidad}`);
      const j = await r.json();
      if (j.valido) {
        setEstado({ ok: true, mensaje: `Código aplicado: −${pesos(j.descuento)}` });
        onCambio({ codigo: c, descuento: j.descuento, total: j.total });
      } else {
        setEstado({ ok: false, mensaje: j.mensaje || 'Ese código no es válido.' });
        onCambio(null);
      }
    } catch {
      setEstado({ ok: false, mensaje: 'No pudimos revisar el código. Inténtalo de nuevo.' });
    }
    setCargando(false);
  }

  if (!abierto) {
    return (
      <button type="button" className={claro ? 'cc-abrir cc-claro' : 'cc-abrir'} onClick={() => setAbierto(true)}>
        ¿Tienes un código de descuento?
      </button>
    );
  }

  return (
    <div className={claro ? 'cc cc-claro' : 'cc'}>
      <div className="cc-fila">
        <input
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value.toUpperCase());
            if (estado) {
              setEstado(null);
              onCambio(null);
            }
          }}
          placeholder="CÓDIGO"
          aria-label="Código de descuento"
          autoCapitalize="characters"
        />
        <button type="button" onClick={aplicar} disabled={cargando || !codigo.trim()}>
          {cargando ? 'Revisando…' : 'Aplicar'}
        </button>
      </div>
      {estado && <p className={estado.ok ? 'cc-ok' : 'cc-error'}>{estado.mensaje}</p>}
    </div>
  );
}
