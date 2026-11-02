"use client";

import { useRef } from "react";
import {
  AJUSTE_CHILE, DESCUENTO_TAMANO, FUENTES_MULTIPLOS, MULTIPLO_EEUU, MULTIPLO_MAX, MULTIPLO_MIN, MULTIPLOS_PAIS,
  RUBROS_POR_SECTOR, SECTORES_MERCADO, multiploMercado,
} from "@/lib/valorizacion";

const f = (n: number, d = 1) => n.toFixed(d).replace(".", ",");

// Botón «Múltiplos de EBITDA»: ventana informativa con los múltiplos de Latinoamérica y el múltiplo que usa el valorizador.
export function MultiplosEbitda({ rubro }: { rubro?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const cerrar = () => ref.current?.close();
  const sectores = Object.values(SECTORES_MERCADO).sort((a, b) => b.evEbitda - a.evEbitda);
  return (
    <>
      <button type="button" className="btn ghost dx-regalias-btn" onClick={() => ref.current?.showModal()} aria-haspopup="dialog">
        📈 Múltiplos de EBITDA
      </button>
      <dialog ref={ref} className="pt-dialogo dx-regalias" aria-labelledby="va-mult-t" onClick={(e) => { if (e.target === ref.current) cerrar(); }}>
        <div className="pt-caja">
          <div className="pt-barra">
            <h2 id="va-mult-t">Múltiplos de EBITDA</h2>
            <button type="button" className="pt-cerrar" onClick={cerrar} aria-label="Cerrar">✕</button>
          </div>
          <p className="pf-ayuda dx-reg-intro">
            El múltiplo dice cuántas veces su utilidad anual (EBITDA) vale una empresa. Estos son los de empresas en bolsa de
            Latinoamérica. Un negocio chico vale menos veces su utilidad, por eso el valorizador los ajusta a Chile
            (× {f(AJUSTE_CHILE, 2)}) y los rebaja por tamaño (× {f(DESCUENTO_TAMANO["pequeño"], 2)} pequeño,
            × {f(DESCUENTO_TAMANO.mediano, 2)} mediano, × {f(DESCUENTO_TAMANO.grande, 2)} grande), entre {f(MULTIPLO_MIN)} y {f(MULTIPLO_MAX)} veces.
          </p>

          <h3>Por sector · Latinoamérica</h3>
          <div className="dx-reg-tabla">
            <table>
              <thead><tr><th scope="col">Sector y rubros</th><th scope="col">Empresas en bolsa</th><th scope="col">Tu negocio (pequeño a grande)</th></tr></thead>
              <tbody>
                {sectores.map((s) => {
                  const rubros = s.id === "general" ? ["Otro rubro"] : RUBROS_POR_SECTOR(s.id);
                  const r0 = rubros[0] === "Otro rubro" ? "" : rubros[0];
                  const a = multiploMercado(r0, "pequeño").multiplo, b = multiploMercado(r0, "grande").multiplo;
                  const tuyo = rubro && (RUBROS_POR_SECTOR(s.id).includes(rubro) || (s.id === "general" && !Object.values(SECTORES_MERCADO).some((x) => x.id !== "general" && RUBROS_POR_SECTOR(x.id).includes(rubro))));
                  return (
                    <tr key={s.id} className={tuyo ? "va-mult-tuyo" : undefined}>
                      <td><strong>{s.nombre}</strong><small>{rubros.join(", ")}</small>{tuyo && <em>Tu rubro</em>}</td>
                      <td className="num" data-et="En bolsa">{f(s.evEbitda)}x</td>
                      <td className="num" data-et="Tu negocio">{a === b ? `${f(a)}x` : `${f(a)}x a ${f(b)}x`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3>Por país · enero 2026</h3>
          <div className="dx-reg-tabla">
            <table>
              <thead><tr><th scope="col">País</th><th scope="col">EV/EBITDA</th><th scope="col">Empresas</th></tr></thead>
              <tbody>
                {MULTIPLOS_PAIS.map(([p, m, n]) => (
                  <tr key={p} className={p === "Chile" ? "va-mult-tuyo" : undefined}>
                    <td><strong>{p}</strong></td><td className="num" data-et="EV/EBITDA">{f(m, 2)}x</td><td className="num" data-et="Empresas">{n}</td>
                  </tr>
                ))}
                <tr><td><strong>Estados Unidos</strong><small>Referencia</small></td><td className="num" data-et="EV/EBITDA">{f(MULTIPLO_EEUU, 2)}x</td><td className="num" data-et="Empresas">4.770</td></tr>
              </tbody>
            </table>
          </div>
          <p className="pf-nota">
            El múltiplo de Argentina está inflado por la inflación. Fuentes:{" "}
            {FUENTES_MULTIPLOS.map(([t, u], i) => (
              <span key={u}><a href={u} target="_blank" rel="noopener noreferrer">{t}</a>{i < FUENTES_MULTIPLOS.length - 1 ? " · " : "."}</span>
            ))}
          </p>
          <div className="pf-acciones"><button type="button" className="btn" onClick={cerrar}>Volver al valorizador</button></div>
        </div>
      </dialog>
    </>
  );
}
