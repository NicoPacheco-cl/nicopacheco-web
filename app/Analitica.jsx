'use client';

import { useEffect } from 'react';

// Medición propia y anónima: visitas, de dónde llegan y segundos por sección.
// Usa un identificador aleatorio en el navegador; no guarda nombres, correos ni direcciones IP.
function id(clave, almacen) {
  try {
    let v = almacen.getItem(clave);
    if (!v) {
      v = Math.random().toString(36).slice(2) + Date.now().toString(36);
      almacen.setItem(clave, v);
    }
    return v;
  } catch {
    return 'anonimo';
  }
}

export default function Analitica() {
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    const visitante = id('np_v', localStorage);
    const sesion = id('np_s', sessionStorage);
    const q = new URLSearchParams(location.search);

    fetch('/api/t', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        tipo: 'visita',
        visitante,
        sesion,
        ruta: location.pathname,
        referente: document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : null,
        fuente: q.get('utm_source'),
        medio: q.get('utm_medium'),
        campana: q.get('utm_campaign'),
      }),
    }).catch(() => {});

    // Tiempo visible de cada sección con id
    const acumulado = {};
    const visibleDesde = {};
    const secciones = [...document.querySelectorAll('main section[id]')];
    const obs = new IntersectionObserver(
      (entradas) => {
        const ahora = performance.now();
        for (const e of entradas) {
          const s = e.target.id;
          if (e.isIntersecting && e.intersectionRatio >= 0.35) {
            visibleDesde[s] ??= ahora;
          } else if (visibleDesde[s] != null) {
            acumulado[s] = (acumulado[s] || 0) + (ahora - visibleDesde[s]);
            delete visibleDesde[s];
          }
        }
      },
      { threshold: [0, 0.35] }
    );
    secciones.forEach((s) => obs.observe(s));

    function enviar() {
      const ahora = performance.now();
      for (const s of Object.keys(visibleDesde)) {
        acumulado[s] = (acumulado[s] || 0) + (ahora - visibleDesde[s]);
        visibleDesde[s] = ahora;
      }
      const datos = Object.fromEntries(
        Object.entries(acumulado)
          .map(([s, ms]) => [s, Math.round(ms / 1000)])
          .filter(([, seg]) => seg >= 1)
      );
      for (const k of Object.keys(acumulado)) delete acumulado[k];
      if (!Object.keys(datos).length) return;
      const cuerpo = JSON.stringify({ tipo: 'tiempos', sesion, datos });
      if (!navigator.sendBeacon?.('/api/t', new Blob([cuerpo], { type: 'application/json' }))) {
        fetch('/api/t', { method: 'POST', body: cuerpo, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
      }
    }

    const alOcultar = () => document.visibilityState === 'hidden' && enviar();
    document.addEventListener('visibilitychange', alOcultar);
    window.addEventListener('pagehide', enviar);
    return () => {
      obs.disconnect();
      document.removeEventListener('visibilitychange', alOcultar);
      window.removeEventListener('pagehide', enviar);
    };
  }, []);

  return null;
}
