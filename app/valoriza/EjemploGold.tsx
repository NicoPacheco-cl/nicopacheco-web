"use client";

import { useEffect, useRef, useState } from "react";

// Certificado Gold de ejemplo ya abierto (24 oct 2026, pedido de Nico): las páginas del PDF de ejemplo dibujadas con
// pdf.js dentro de un recuadro con desplazamiento. Se carga recién cuando el recuadro aparece en pantalla.
export function EjemploGold({ url }: { url: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<"espera" | "cargando" | "listo" | "error">("espera");

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    let cancelado = false;
    const dibujar = async () => {
      setEstado("cargando");
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        const r = await fetch(url);
        if (!r.ok) throw new Error("sin pdf");
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await r.arrayBuffer()) }).promise;
        const ancho = el.clientWidth - 16;
        for (let n = 1; n <= doc.numPages && !cancelado; n++) {
          const pg = await doc.getPage(n);
          const base = pg.getViewport({ scale: 1 });
          const escala = (ancho / base.width) * Math.min(2, window.devicePixelRatio || 1);
          const vp = pg.getViewport({ scale: escala });
          const c = document.createElement("canvas");
          c.width = vp.width; c.height = vp.height;
          c.style.width = "100%";
          c.setAttribute("aria-label", `Página ${n} del certificado de ejemplo`);
          await pg.render({ canvas: c, canvasContext: c.getContext("2d")!, viewport: vp }).promise;
          if (cancelado) return;
          el.querySelector(".eg-paginas")?.appendChild(c);
          if (n === 1) setEstado("listo");
        }
      } catch {
        if (!cancelado) setEstado("error");
      }
    };
    const io = new IntersectionObserver((xs) => { if (xs.some((x) => x.isIntersecting)) { io.disconnect(); dibujar(); } }, { rootMargin: "200px" });
    io.observe(el);
    return () => { cancelado = true; io.disconnect(); };
  }, [url]);

  return (
    <div className="eg">
      <div className="eg-cab"><b>Ejemplo de certificado Gold</b><a href={url} target="_blank" rel="noopener">Abrir en grande ↗</a></div>
      <div className="eg-caja" ref={caja}>
        {estado !== "listo" && (
          <p className="eg-msg">{estado === "error" ? <>No se pudo mostrar aquí. <a href={url} target="_blank" rel="noopener">Ábrelo en una pestaña nueva</a>.</> : "Cargando el ejemplo…"}</p>
        )}
        <div className="eg-paginas" />
      </div>
    </div>
  );
}
