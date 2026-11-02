"use client";

// Inventario detallado (29 oct 2026) de la dimensión «Equipos e inventario» de /valoriza. Lógica en lib/inventario.ts.
import { useState } from "react";
import {
  CATEGORIAS_INVENTARIO, conDetalle, detalleManda, factorItem, LIMITE_ITEMS, nuevoTotalDe, totalesInventario, unidadesDe, ventaUnitaria,
  type IdCategoria, type ItemInventario,
} from "@/lib/inventario";
import { clp, factorEquipos, valorVehiculos, type DatosValorizacion } from "@/lib/valorizacion";

const miles = (v: string) => (v ? Number(v).toLocaleString("es-CL") : "");
const solo = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
const pct = (f: number) => `${Math.round(f * 100)}%`;
const nuevoId = () => Math.random().toString(36).slice(2, 10);
const n0 = (v?: string) => Math.max(0, Number(String(v ?? "").replace(/\D/g, "")) || 0);

// Sirve en /valoriza (con DatosValorizacion).
export type DatosInventario = Pick<DatosValorizacion, "anosUso" | "vehiculos" | "vehiculosAnos" | "vehiculosNuevo" | "inventarioDetalle"> & { inventarioNuevo?: string };
type Props = { d: DatosInventario; cambiar: (x: Partial<DatosValorizacion>) => void; notaVehiculos?: string };

/** Recuadro de arriba: valor total del inventario hoy (con o sin detalle). */
export function TotalInventario({ d }: { d: DatosInventario }) {
  const items = d.inventarioDetalle ?? [];
  const t = totalesInventario(items, d);
  const manda = detalleManda(items);
  // Sin detalle se usan los campos escritos a mano, con las mismas reglas.
  const equiposHoy = manda.equipos ? t.ventaEquipos : Math.round(n0(d.inventarioNuevo) * factorEquipos(n0(d.anosUso)));
  const vehiculosHoy = d.vehiculos !== "si" ? 0 : manda.vehiculos ? t.ventaVehiculos : valorVehiculos(d);
  const nuevo = (manda.equipos ? t.nuevoEquipos : n0(d.inventarioNuevo)) + (d.vehiculos === "si" ? (manda.vehiculos ? t.nuevoVehiculos : n0(d.vehiculosNuevo)) : 0);
  const total = equiposHoy + vehiculosHoy;
  return (
    <div className="inv-total va-ancho" aria-live="polite">
      <div>
        <span className="inv-total-et">Valor total del inventario hoy</span>
        <strong className="num">{total ? clp(total) : "$0"}</strong>
      </div>
      {manda.equipos && !n0(d.anosUso) && (
        <p className="inv-aviso">⚠️ Indica los <b>años de uso de los equipos</b>: por cada año se descuenta la depreciación. Sin ese dato el precio de venta queda igual al nuevo.</p>
      )}
      <dl>
        <div><dt>Precio nuevo</dt><dd className="num">{clp(nuevo)}</dd></div>
        <div><dt>Equipos ({d.anosUso ? `${d.anosUso} ${d.anosUso === "1" ? "año" : "años"} de uso` : "sin años de uso"})</dt><dd className="num">{clp(equiposHoy)}</dd></div>
        {vehiculosHoy > 0 && <div><dt>Vehículos</dt><dd className="num">{clp(vehiculosHoy)}</dd></div>}
        {t.items > 0 && <div><dt>Ítems detallados</dt><dd className="num">{t.items}</dd></div>}
      </dl>
    </div>
  );
}

export function InventarioDetalle({ d, cambiar, notaVehiculos = "Los años de uso de los vehículos se anotan arriba, en «Años de uso de los vehículos»." }: Props) {
  const items = d.inventarioDetalle ?? [];
  const [abiertas, setAbiertas] = useState<Set<IdCategoria>>(() => new Set(items.map((x) => x.cat)));
  const t = totalesInventario(items, d);
  // Sin años de uso no hay descuento por depreciación: se avisa para que el vendedor los complete.
  const sinAnos = (cat: IdCategoria) => (cat === "vehiculos" ? false : !n0(d.anosUso));

  const guardar = (nuevos: ItemInventario[]) => cambiar(conDetalle(d, nuevos));
  const agregar = (cat: IdCategoria) => {
    if (items.length >= LIMITE_ITEMS) return;
    guardar([...items, { id: nuevoId(), cat, equipo: "", marca: "", unidades: "1", precioNuevo: "" }]);
  };
  const editar = (id: string, k: keyof ItemInventario, v: string) => guardar(items.map((x) => (x.id === id ? { ...x, [k]: v } : x)));
  const quitar = (id: string) => guardar(items.filter((x) => x.id !== id));
  const alternar = (cat: IdCategoria) => {
    const abrir = !abiertas.has(cat);
    setAbiertas((s) => { const x = new Set(s); if (abrir) x.add(cat); else x.delete(cat); return x; });
    if (abrir && !items.some((x) => x.cat === cat)) agregar(cat); // al abrir una categoría vacía aparece la primera fila
  };

  return (
    <section className="inv va-ancho" aria-labelledby="inv-titulo">
      <div className="inv-cab">
        <h3 id="inv-titulo">Detalle del inventario <span>(opcional)</span></h3>
        <p className="inv-consejo" role="note">
          <span aria-hidden="true">📈</span>
          <span><strong>Completa tu inventario con el mayor detalle posible.</strong> Sube el valor de tu negocio y tu certificado queda más completo.</span>
        </p>
        <p className="pf-ayuda">
          Toca cada categoría y anota equipo, marca, unidades y precio nuevo. El precio de venta se calcula solo con los años de uso que pusiste arriba
          (equipos: precio nuevo ÷ (años + 1), hasta ÷5; vehículos: −8% por año, mínimo 20%). El detalle le da respaldo al comprador.
        </p>
      </div>

      {CATEGORIAS_INVENTARIO.map((c) => {
        const filas = items.filter((x) => x.cat === c.id);
        const abierta = abiertas.has(c.id);
        const sub = t.porCategoria[c.id];
        const f = factorItem(c.id, d);
        return (
          <div key={c.id} className={`inv-cat${abierta ? " on" : ""}`}>
            <button type="button" className="inv-cat-btn" aria-expanded={abierta} aria-controls={`inv-${c.id}`} onClick={() => alternar(c.id)}>
              <span className="inv-ico" aria-hidden="true">{c.icono}</span>
              <span className="inv-cat-t">
                <strong>{c.titulo}</strong>
                <small>{sub.items ? `${sub.items} ${sub.items === 1 ? "ítem" : "ítems"} · nuevo ${clp(sub.nuevo)}` : c.ejemplos}</small>
              </span>
              {sub.venta > 0 && <span className="inv-cat-sub num">{clp(sub.venta)}</span>}
              <span className="inv-flecha" aria-hidden="true">▾</span>
            </button>

            {abierta && (
              <div className="inv-cuerpo" id={`inv-${c.id}`}>
                {c.id === "vehiculos" && d.vehiculos === "no" && filas.length > 0 && <p className="pf-ayuda inv-alerta">Marcaste arriba que la venta no incluye vehículos: estos no se suman. Cámbialo a «Sí» para incluirlos.</p>}
                {c.id === "vehiculos" && <p className="pf-ayuda">{notaVehiculos}</p>}
                {filas.length > 0 && (
                  <div className="inv-lista">
                    {filas.map((it, i) => {
                      const vu = ventaUnitaria(it, d);
                      const u = unidadesDe(it);
                      const nu = Number(it.precioNuevo) || 0;
                      return (
                        <div className="inv-item" key={it.id}>
                          <div className="inv-item-arriba">
                            <label className="inv-c inv-eq"><span>Equipo</span><input value={it.equipo} maxLength={60} placeholder={i === 0 ? c.ejemplos.split(",")[0] : "Equipo"} onChange={(e) => editar(it.id, "equipo", e.target.value)} /></label>
                            <label className="inv-c"><span>Marca</span><input value={it.marca} maxLength={40} placeholder="Marca" onChange={(e) => editar(it.id, "marca", e.target.value)} /></label>
                            <label className="inv-c inv-un"><span>Unidades</span><input inputMode="numeric" value={it.unidades} placeholder="1" onChange={(e) => editar(it.id, "unidades", solo(e.target.value, 4))} className="num" /></label>
                            <button type="button" className="inv-quitar" onClick={() => quitar(it.id)} aria-label={`Quitar ${it.equipo || "fila"}`} title="Quitar">✕</button>
                          </div>
                          <div className="inv-item-abajo">
                            <div className="inv-c">
                              <label htmlFor={`pn-${it.id}`}>Precio nuevo por unidad</label>
                              <span className="inv-pesos"><span aria-hidden="true">$</span><input id={`pn-${it.id}`} inputMode="numeric" value={miles(it.precioNuevo)} placeholder="0" onChange={(e) => editar(it.id, "precioNuevo", solo(e.target.value, 12))} className="num" /></span>
                              <span className="inv-tot">Total nuevo{u !== 1 ? ` (${u} unid.)` : ""}: <b className="num">{clp(nu * u)}</b></span>
                            </div>
                            <div className="inv-c">
                              <span className="inv-lbl">Precio de venta por unidad <em>({pct(f)} del nuevo)</em></span>
                              <span className={`inv-venta num${sinAnos(c.id) ? " sin" : ""}`}>{vu ? clp(vu) : "$0"}</span>
                              <span className="inv-tot">Total venta{u !== 1 ? ` (${u} unid.)` : ""}: <b className="num">{clp(vu * u)}</b></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="inv-pie">
                  <button type="button" className="inv-agregar" onClick={() => agregar(c.id)} disabled={items.length >= LIMITE_ITEMS}>+ Agregar {c.id === "vehiculos" ? "vehículo" : "equipo"}</button>
                  {sub.items > 0 && <span>Subtotal: nuevo <b className="num">{clp(sub.nuevo)}</b> · venta <b className="num">{clp(sub.venta)}</b></span>}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {t.items > 0 && (
        <div className="inv-suma">
          <span>Total inventario detallado</span>
          <span>Nuevo <b className="num">{clp(t.nuevo)}</b></span>
          <span>Venta <b className="num">{clp(t.venta)}</b></span>
        </div>
      )}
      {items.length > 0 && items.some((x) => !nuevoTotalDe(x)) && <p className="pf-ayuda">Las filas sin precio no se suman.</p>}
    </section>
  );
}
