// Inventario detallado (29 oct 2026, pedido de Nico): en la dimensión «Equipos e inventario» de /valoriza el vendedor
// puede detallar sus equipos por categoría (equipo, marca, unidades y precio nuevo c/u). El precio de venta de cada
// uno se calcula solo con los años de uso que indicó más arriba, con las MISMAS reglas que ya usa el valorizador:
//   - equipos: precio nuevo × factorEquipos(años de uso) = precio nuevo ÷ (años de uso + 1), máximo ÷5 (es el «piso»);
//   - vehículos: precio nuevo × factorVehiculo(años de uso de los vehículos) = −8% por año, mínimo 20%.
// Con detalle, la suma de los precios nuevos reemplaza a «Valor neto de los equipos como nuevos» (`inventarioNuevo`)
// y a «¿Cuánto cuestan los vehículos nuevos hoy?» (`vehiculosNuevo`), así el valor no cambia de fórmula.
import { factorEquipos, factorVehiculo, type DatosValorizacion } from "./valorizacion";

export type IdCategoria =
  | "equipamiento" | "vehiculos" | "electrodomesticos" | "tecnologia" | "seguridad"
  | "mob_oficina" | "cocina" | "vitrinas" | "mob_local" | "otros";

export const CATEGORIAS_INVENTARIO: { id: IdCategoria; titulo: string; ejemplos: string; icono: string }[] = [
  { id: "equipamiento", titulo: "Equipamiento y maquinaria", ejemplos: "Hornos industriales, máquinas de café, cortadoras, balanzas, máquinas de producción", icono: "⚙️" },
  { id: "vehiculos", titulo: "Vehículos", ejemplos: "Camioneta de reparto, furgón, moto, carro, food truck", icono: "🚚" },
  { id: "electrodomesticos", titulo: "Electrodomésticos", ejemplos: "Microondas, licuadoras, refrigerador, lavadora, aire acondicionado", icono: "🔌" },
  { id: "tecnologia", titulo: "Equipos tecnológicos", ejemplos: "Computadores, caja / punto de venta, impresoras, tablets, televisores", icono: "💻" },
  { id: "seguridad", titulo: "Equipos de seguridad", ejemplos: "Cámaras, grabador (DVR), alarma, caja fuerte, extintores, cortina metálica", icono: "📹" },
  { id: "mob_oficina", titulo: "Mobiliario de oficina", ejemplos: "Escritorios, sillas, archivadores, estantes", icono: "🗄️" },
  { id: "cocina", titulo: "Equipamiento de cocina", ejemplos: "Cocinas, campanas, freidoras, planchas, mesones de acero, lavafondos", icono: "🍳" },
  { id: "vitrinas", titulo: "Vitrinas y refrigeración", ejemplos: "Vitrinas refrigeradas, conservadoras, cámaras de frío, congeladores", icono: "🧊" },
  { id: "mob_local", titulo: "Mobiliario del local", ejemplos: "Mesas, sillas, mesón de atención, góndolas, letrero", icono: "🪑" },
  { id: "otros", titulo: "Otros", ejemplos: "Todo lo que no calce en las categorías anteriores", icono: "📦" },
];
const IDS = new Set<string>(CATEGORIAS_INVENTARIO.map((c) => c.id));

export type ItemInventario = { id: string; cat: IdCategoria; equipo: string; marca: string; unidades: string; precioNuevo: string };

export const LIMITE_ITEMS = 150;
const num = (v?: string) => Math.max(0, Number(String(v ?? "").replace(/\D/g, "")) || 0);
/** Unidades vacías cuentan como 1 (lo normal es tener uno). */
export const unidadesDe = (it: Pick<ItemInventario, "unidades">) => (String(it.unidades ?? "").trim() === "" ? 1 : num(it.unidades));
export const nuevoTotalDe = (it: ItemInventario) => unidadesDe(it) * num(it.precioNuevo);
const esVehiculo = (it: ItemInventario) => it.cat === "vehiculos";

type Anos = Pick<DatosValorizacion, "anosUso" | "vehiculosAnos"> & { vehiculos?: DatosValorizacion["vehiculos"] };
/** Fracción del precio nuevo que vale hoy un ítem de esa categoría. */
export function factorItem(cat: IdCategoria, d: Anos) {
  return cat === "vehiculos" ? factorVehiculo(num(d.vehiculosAnos)) : factorEquipos(num(d.anosUso));
}
/** Precio de venta por unidad (redondeado a pesos). */
export const ventaUnitaria = (it: ItemInventario, d: Anos) => Math.round(num(it.precioNuevo) * factorItem(it.cat, d));

export type Totales = {
  items: number;                // ítems con precio
  nuevoEquipos: number; nuevoVehiculos: number; nuevo: number;
  ventaEquipos: number; ventaVehiculos: number; venta: number;
  porCategoria: Record<IdCategoria, { items: number; nuevo: number; venta: number }>;
};

/** Totales del detalle. Los de equipos y vehículos se redondean sobre la suma, igual que el valorizador. */
export function totalesInventario(items: ItemInventario[] | undefined, d: Anos): Totales {
  const porCategoria = Object.fromEntries(CATEGORIAS_INVENTARIO.map((c) => [c.id, { items: 0, nuevo: 0, venta: 0 }])) as Totales["porCategoria"];
  let nuevoEquipos = 0, nuevoVehiculos = 0, n = 0;
  for (const it of items ?? []) {
    if (esVehiculo(it) && d.vehiculos === "no") continue; // marcó que la venta no incluye vehículos
    const t = nuevoTotalDe(it);
    if (!t || !porCategoria[it.cat]) continue;
    n++;
    porCategoria[it.cat].items++;
    porCategoria[it.cat].nuevo += t;
    if (esVehiculo(it)) nuevoVehiculos += t; else nuevoEquipos += t;
  }
  for (const c of CATEGORIAS_INVENTARIO) porCategoria[c.id].venta = Math.round(porCategoria[c.id].nuevo * factorItem(c.id, d));
  const ventaEquipos = Math.round(nuevoEquipos * factorEquipos(num(d.anosUso)));
  const ventaVehiculos = Math.round(nuevoVehiculos * factorVehiculo(num(d.vehiculosAnos)));
  return { items: n, nuevoEquipos, nuevoVehiculos, nuevo: nuevoEquipos + nuevoVehiculos, ventaEquipos, ventaVehiculos, venta: ventaEquipos + ventaVehiculos, porCategoria };
}

/** ¿El detalle manda sobre el campo de equipos / de vehículos? (hay al menos un ítem con precio de ese tipo) */
export function detalleManda(items: ItemInventario[] | undefined) {
  const conPrecio = (items ?? []).filter((it) => nuevoTotalDe(it) > 0);
  return { equipos: conPrecio.some((it) => !esVehiculo(it)), vehiculos: conPrecio.some(esVehiculo) };
}

/**
 * Cambios a aplicar en los datos al cambiar el detalle: la suma de precios nuevos pasa a `inventarioNuevo` y
 * `vehiculosNuevo`. Si se borra el último ítem con precio de un tipo, ese campo queda vacío para escribirlo a mano.
 */
export function conDetalle(d: Pick<DatosValorizacion, "inventarioDetalle" | "vehiculos">, items: ItemInventario[]): Partial<DatosValorizacion> {
  const antes = detalleManda(d.inventarioDetalle), ahora = detalleManda(items);
  const t = totalesInventario(items, { anosUso: "", vehiculosAnos: "" });
  const x: Partial<DatosValorizacion> = { inventarioDetalle: items };
  if (ahora.equipos) x.inventarioNuevo = String(t.nuevoEquipos);
  else if (antes.equipos) x.inventarioNuevo = "";
  if (ahora.vehiculos) { x.vehiculos = "si"; x.vehiculosNuevo = String(t.nuevoVehiculos); }
  else if (antes.vehiculos) x.vehiculosNuevo = "";
  return x;
}

/** Servidor: deja solo ítems válidos (categoría conocida, textos cortos, números) y como máximo LIMITE_ITEMS. */
export function limpiarInventario(x: unknown): ItemInventario[] {
  if (!Array.isArray(x)) return [];
  const txt = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
  const dig = (v: unknown, max: number) => (typeof v === "string" || typeof v === "number" ? String(v).replace(/\D/g, "").slice(0, max) : "");
  const out: ItemInventario[] = [];
  for (const it of x) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    if (typeof o.cat !== "string" || !IDS.has(o.cat)) continue;
    const item: ItemInventario = {
      id: txt(o.id, 24) || String(out.length + 1), cat: o.cat as IdCategoria,
      equipo: txt(o.equipo, 60), marca: txt(o.marca, 40), unidades: dig(o.unidades, 4), precioNuevo: dig(o.precioNuevo, 12),
    };
    if (!item.equipo && !item.precioNuevo) continue;
    out.push(item);
    if (out.length >= LIMITE_ITEMS) break;
  }
  return out;
}

/** Servidor: si hay detalle, los totales de precio nuevo se recalculan desde él (no se confía en lo que manda el navegador). */
export function aplicarDetalle<T extends DatosValorizacion>(d: T): T {
  const items = limpiarInventario(d.inventarioDetalle).filter((it) => !(esVehiculo(it) && d.vehiculos === "no"));
  if (!items.length) { const { inventarioDetalle: _, ...resto } = d; return resto as T; }
  return { ...d, ...conDetalle({ inventarioDetalle: [], vehiculos: d.vehiculos }, items) };
}

// ---------- Resumen para mostrar al comprador (información gratis, acceso, admin) ----------
export type ResumenInventario = {
  anosUso: string; vehiculosAnos: string;
  categorias: { titulo: string; icono: string; items: number; unidades: number; filas: { equipo: string; marca: string; unidades: number; nuevo: number; venta: number }[]; nuevo: number; venta: number }[];
  nuevo: number; venta: number; items: number;
};

/** Detalle del aviso listo para mostrar: por categoría, con precio nuevo y de venta c/u. null si no hay detalle con precio. */
export function resumenInventario(inv: { mobiliario?: string; anosUso?: string; vehiculosAnos?: string; detalle?: ItemInventario[] } | undefined): ResumenInventario | null {
  if (!inv || inv.mobiliario === "no") return null;
  const items = limpiarInventario(inv.detalle).filter((it) => nuevoTotalDe(it) > 0);
  if (!items.length) return null;
  const d = { anosUso: inv.anosUso ?? "", vehiculosAnos: inv.vehiculosAnos ?? "" };
  const t = totalesInventario(items, d);
  const categorias = CATEGORIAS_INVENTARIO.filter((c) => t.porCategoria[c.id].items > 0).map((c) => ({
    titulo: c.titulo, icono: c.icono, nuevo: t.porCategoria[c.id].nuevo, venta: t.porCategoria[c.id].venta,
    items: t.porCategoria[c.id].items, unidades: items.filter((it) => it.cat === c.id).reduce((s2, it) => s2 + unidadesDe(it), 0),
    filas: items.filter((it) => it.cat === c.id).map((it) => ({
      equipo: it.equipo || "Sin nombre", marca: it.marca, unidades: unidadesDe(it), nuevo: num(it.precioNuevo), venta: ventaUnitaria(it, d),
    })),
  }));
  return { ...d, categorias, nuevo: t.nuevo, venta: t.venta, items: t.items };
}

/** Solo los totales por categoría, sin la lista de equipos (información gratis, 30 oct 2026). */
export const sinDetalle = (r: ResumenInventario | null): ResumenInventario | null =>
  r && { ...r, categorias: r.categorias.map((c) => ({ ...c, filas: [] })) };
