// Módulo de valorización de derechos de llave (Nico Pacheco). Versión 4 del 9 oct 2026: múltiplo de mercado
// ajustado por un puntaje de calidad de 0 a 100 en 11 dimensiones, con deudas por dimensión.

import type { ItemInventario } from "./inventario";

// ---------- Múltiplo de mercado por rubro (reemplaza el tope fijo por tamaño, 6 oct 2026) ----------
// EV/EBITDA mediano de empresas en bolsa de Latinoamérica por sector (Kroll, Industry Multiples in Latin America,
// 30 jun 2025) × ajuste Chile (Damodaran ene 2026: Chile 9,70 ÷ mediana de AR, BR, CL, CO, MX, PE 7,79) × descuento
// por tamaño (negocio chico vs empresa en bolsa). Límites 2,5 a 5 veces la utilidad anual. Revisar cada vez que Kroll publique.

export const AJUSTE_CHILE = 9.7 / 7.785;
export const DESCUENTO_TAMANO = { "pequeño": 0.45, mediano: 0.5, grande: 0.55 } as const;
export const MULTIPLO_MIN = 2.5;
export const MULTIPLO_MAX = 5;

export type SectorMercado = { id: string; nombre: string; evEbitda: number };
export const SECTORES_MERCADO: Record<string, SectorMercado> = {
  consumo: { id: "consumo", nombre: "Servicios al consumidor (restaurantes, hoteles, ocio)", evEbitda: 4.9 },
  alimentos: { id: "alimentos", nombre: "Alimentos, bebidas y tabaco", evEbitda: 6.6 },
  abarrotes: { id: "abarrotes", nombre: "Retail de alimentos y abarrotes", evEbitda: 7.9 },
  retail: { id: "retail", nombre: "Retail de consumo discrecional", evEbitda: 9.3 },
  servicios: { id: "servicios", nombre: "Servicios comerciales y profesionales", evEbitda: 6.7 },
  salud: { id: "salud", nombre: "Salud", evEbitda: 5.6 },
  general: { id: "general", nombre: "Mediana de los sectores de Latinoamérica", evEbitda: 6.6 },
};

const SECTOR_POR_RUBRO: Record<string, keyof typeof SECTORES_MERCADO> = {
  "Cafetería": "consumo", "Restaurante": "consumo", "Belleza y estética": "consumo", "Hotelería y hostales": "consumo", "Turismo": "consumo",
  "Panadería": "alimentos",
  "Botillería": "abarrotes", "Minimarket": "abarrotes",
  "Retail y tiendas": "retail",
  "Servicios": "servicios",
  "Salud y farmacia": "salud",
};

// Datos que se muestran en el botón «Múltiplos de EBITDA» (solo informativo).
export const MULTIPLOS_PAIS: [string, number, number][] = [
  ["Argentina", 10.37, 60], ["Chile", 9.70, 98], ["México", 8.38, 91], ["Brasil", 7.19, 245], ["Colombia", 6.68, 20], ["Perú", 6.14, 46],
];
export const MULTIPLO_EEUU = 12.4;
export const RUBROS_POR_SECTOR = (id: string) => Object.entries(SECTOR_POR_RUBRO).filter(([, s]) => s === id).map(([r]) => r);
export const FUENTES_MULTIPLOS = [
  ["Kroll, Industry Multiples in Latin America (30 jun 2025)", "https://www.kroll.com/en/publications/valuation/industry-multiples-in-latin-america-q1-q2-2025"],
  ["Damodaran (NYU), promedios por país (enero 2026)", "https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/countrystats.html"],
] as const;

export const sectorDeRubro = (rubro: string) => SECTORES_MERCADO[SECTOR_POR_RUBRO[rubro] ?? "general"];

export function multiploMercado(rubro: string, tamano: keyof typeof DESCUENTO_TAMANO) {
  const sector = sectorDeRubro(rubro);
  const bruto = sector.evEbitda * AJUSTE_CHILE * DESCUENTO_TAMANO[tamano];
  const multiplo = Math.round(Math.min(MULTIPLO_MAX, Math.max(MULTIPLO_MIN, bruto)) * 100) / 100;
  return { sector, multiplo, limitado: bruto > MULTIPLO_MAX || bruto < MULTIPLO_MIN };
}

// =====================================================================================================
// Valorización v4 (9 oct 2026): múltiplo de mercado ajustado por un puntaje de calidad de 0 a 100.
//
//   Utilidad normalizada  = utilidad mensual (sin la venta de alcohol sin patente) − sueldo de reemplazo del dueño
//   Valor base            = utilidad normalizada × 12 × múltiplo de mercado del rubro (Kroll + Chile + tamaño)
//   Factor de calidad     = 0,60 con 0 puntos · 0,75 con 30 · 1,00 con 70 · 1,20 con 100 (lineal entre tramos)
//   Valor operacional     = mínimo entre (base × factor × entorno) y el tope por contrato (17 oct): utilidad × los meses
//                           que quedan (+12 si hay renovación por escrito) × 40% (Standard) o 50% (Gold/Platinum verificado).
//                           La prima por verificación y el descuento por marca se aplican sobre ese valor ya topado.
//   Piso                  = valor de los equipos (valor como nuevo ÷ (años de uso + 1), máximo 5)
//   Valor final           = máx(operacional, piso) + mercadería a costo − todas las deudas declaradas (mínimo 0)
//
// Cada una de las 11 dimensiones suma puntos; las deudas de una dimensión le restan puntos (riesgo) y además
// su monto se descuenta completo del valor (dinero). Los permisos graves ponen un techo al puntaje total.
// =====================================================================================================

export type Nivel = "alto" | "regular" | "bajo" | "";
export type Infra = "nuevo" | "bueno" | "mantencion" | "";
export type SN = "si" | "no" | "";
export type TipoResolucion = "restaurante" | "cafeteria" | "panaderia" | "paso" | "otro" | "no" | "";
export type PatenteAlcohol = "c" | "limitada" | "ninguna" | "";

export const TIPOS_RESOLUCION: [Exclude<TipoResolucion, "">, string, string][] = [
  ["restaurante", "Restaurante", "Con consumo en el local (con o sin alcohol)"],
  ["cafeteria", "Cafetería con elaboración de platos", "Prepara platos y tiene consumo en el local"],
  ["panaderia", "Panadería o pastelería", "Elaboración con venta para llevar"],
  ["paso", "Local de comida al paso", "Solo para llevar o atención en barra, sin mesas"],
  ["otro", "Otro tipo de resolución sanitaria", "Por ejemplo: minimarket, botillería, salón de belleza, barbería, etc."],
  ["no", "No tiene", ""],
];

export const SISTEMAS: [string, string, number][] = [
  ["pos", "Punto de venta o caja electrónica (boletas y ventas por día)", 1.5],
  ["procesos", "Recetas, manuales o procesos escritos", 1.5],
  ["inventario", "Control de inventario o bodega", 1],
  ["erp", "ERP o sistema de gestión que integra ventas, compras y contabilidad", 1],
  ["compras", "Sistema de compras y proveedores", 0.75],
  ["rrhh", "Sistema de remuneraciones o recursos humanos", 0.75],
  ["crm", "CRM o base de clientes", 0.5],
];

export type DatosValorizacion = {
  // 0. Qué se vende (10 oct 2026): define qué preguntas aplican
  conRazonSocial: SN;          // ¿se vende la empresa (razón social) o solo el negocio?
  conCuenta: SN;               // solo con razón social: ¿incluye la cuenta corriente?
  trabajadoresPasan: SN;       // sin razón social: ¿los trabajadores siguen con el comprador?
  conMarca: SN;                // ¿incluye la marca o nombre comercial?
  conRedes: SN;                // con marca: ¿incluye las cuentas de redes sociales?
  // 1. El negocio
  rubro: string; region: string; comuna: string;
  ventaMensual: string;        // venta bruta (con IVA): valorizaciones antiguas
  ventaNeta?: string;          // venta neta mensual promedio (sin IVA)
  ventaNetaAnterior?: string;  // venta neta mensual de hace 12 meses (crecimiento)
  utilidadMensual: string;     // utilidad mensual promedio (EBITDA)
  anosFuncionando: string;
  trabajadores: string;
  dependenciaDueno: "baja" | "media" | "alta" | "";
  utilidadConSueldo: SN;       // ¿la utilidad ya descuenta un sueldo para quien administra?
  sueldoReemplazo: string;     // si no: cuánto costaría reemplazar el trabajo del dueño
  // 2. Arriendo
  arriendo: string; mesesRestantes: string;
  // Arriendo en UF (11 oct): si arriendoMoneda = "uf", `arriendo` guarda el equivalente en pesos (UF × valorUF)
  arriendoMoneda?: "clp" | "uf"; arriendoUF?: string; valorUF?: string;
  gastoComun?: string;          // gasto común mensual ($)
  otrosCobros?: SN; otrosCobrosMonto?: string; otrosCobrosDetalle?: string; // otros cobros mensuales del arrendador
  m2?: string;                  // superficie del local (se muestra junto a la recuperación de la inversión)
  renovacion: SN; autorizaCesion: "si" | "conversacion" | "no" | ""; contratoNotarial: SN;
  terminoAnticipado?: SN;       // 16 oct: ¿el arrendador puede terminar el contrato antes, sin causa? (se verifica con el contrato)
  deudaArriendo: SN; deudaArriendoMonto: string;
  // 3. Equipos e inventario
  inventarioNuevo: string; anosUso: string; mercaderia: string;
  inventarioDetalle?: ItemInventario[]; // 29 oct: detalle opcional por categoría (lib/inventario.ts); no está en VALORIZACION_VACIA
  vehiculos?: SN; vehiculosNuevo?: string; vehiculosAnos?: string; vehiculosAlDia?: SN; // 17 oct: vehículos incluidos (precio nuevo y años de uso; papeles al día)
  equiposFacturas: SN; mantenciones: SN;
  deudaEquipos: SN; deudaEquiposMonto: string;
  // 4. Ubicación
  peatonal: Nivel; vehicular: Nivel;
  // 5. Entorno (13 oct 2026): centro comercial y tienda ancla, temporada de ventas y competencia a 500 m
  entornoTipo: "calle" | "strip" | "mall" | "galeria" | "";
  tiendaAncla: SN; tiendaAnclaNombre: string;
  estacionalidad: "pareja" | "temporada" | "alta" | "";
  competencia: "ninguna" | "poca" | "mucha" | "";   // competidores directos a menos de 500 m: 0 / 1–2 / 3 o más
  // 6. El local
  infraestructura: Infra; estacionamientos: string; stripCenter: SN;
  // 7. Patentes y permisos
  patente: "definitiva" | "provisoria" | "no" | "";
  mef: SN; mefViveAhi: SN; mefExcede: SN;
  sanitaria: SN;               // se deriva de tipoResolucion (compatibilidad)
  tipoResolucion: TipoResolucion; mesas: SN; regularizable: SN;
  alcohol: PatenteAlcohol; alcoholSinComida: SN; vendeAlcohol: SN; pctAlcohol: string;
  deudaPermisos: SN; deudaPermisosMonto: string;
  patenteGiro?: SN;             // 16 oct: ¿el giro de la patente cubre todo lo que vende? (se verifica con la patente)
  // 8. Estado financiero
  eerr: "si" | "parcial" | "no" | ""; flujoCaja: SN; conciliacion: SN; pctRespaldo: string;
  remuneracionesAlDia: SN; ctaCorriente: SN;
  morosidades?: SN;             // 16 oct: ¿morosidades o protestos en el informe comercial (Dicom)? (se verifica con el informe)
  lineaCredito: SN; lineaCupo: string; lineaUsado: string;      // línea de crédito de la cuenta que se traspasa
  tarjetaCredito: SN; tarjetaCupo: string; tarjetaUsado: string; // tarjeta de crédito de la empresa
  saldoCuenta: string;         // saldo a favor en la cuenta: se muestra aparte, se suma al cierre si se traspasa
  deudaFinanciera: SN; deudaFinancieraMonto: string;
  deudaLaboral: SN; deudaLaboralMonto: string;
  // 9. Situación tributaria
  f29AlDia: SN; balance: SN; preBalance: SN; contador: "externo" | "interno" | "no" | "";
  carpetaTributaria: SN; certificadoTgr: SN;
  deudaTributaria: SN; deudaTributariaMonto: string;
  // 10. Sistemas y procesos
  sistemas: string;            // claves de SISTEMAS separadas por coma
  deudaSistemas: SN; deudaSistemasMonto: string;
  // 11. Redes sociales y marca
  instagram: string; tiktok: string; facebook: string; notaGoogle: string; resenasGoogle: string; marcaInapi: SN;
  // Carpeta tributaria del SII (10 oct): ventas y compras de los F29, leídas por el servidor (nunca escritas a mano)
  carpetaToken: string; carpetaEstado: "" | "leida" | "revision" | "verificada" | "rechazada";
  carpetaVentas12: string; carpetaCompras12: string; carpetaVentasAnt12: string; carpetaMeses: string; carpetaUltimo: string; carpetaRazon: string;
  // Compatibilidad con valorizaciones y avisos anteriores al 9 oct 2026
  deudas: SN; deudasMonto: string;
};

export const VALORIZACION_VACIA: DatosValorizacion = {
  conRazonSocial: "", conCuenta: "", trabajadoresPasan: "", conMarca: "", conRedes: "",
  rubro: "", region: "", comuna: "", ventaMensual: "", ventaNeta: "", ventaNetaAnterior: "", utilidadMensual: "",
  anosFuncionando: "", trabajadores: "", dependenciaDueno: "", utilidadConSueldo: "", sueldoReemplazo: "",
  arriendo: "", mesesRestantes: "", arriendoMoneda: "clp", arriendoUF: "", valorUF: "", gastoComun: "", otrosCobros: "", otrosCobrosMonto: "", otrosCobrosDetalle: "", m2: "",
  renovacion: "", autorizaCesion: "", contratoNotarial: "", terminoAnticipado: "", deudaArriendo: "", deudaArriendoMonto: "",
  inventarioNuevo: "", anosUso: "", mercaderia: "", vehiculos: "", vehiculosNuevo: "", vehiculosAnos: "", vehiculosAlDia: "", equiposFacturas: "", mantenciones: "", deudaEquipos: "", deudaEquiposMonto: "",
  peatonal: "", vehicular: "", competencia: "",
  entornoTipo: "", tiendaAncla: "", tiendaAnclaNombre: "", estacionalidad: "",
  infraestructura: "", estacionamientos: "", stripCenter: "",
  patente: "", mef: "", mefViveAhi: "", mefExcede: "", sanitaria: "", tipoResolucion: "", mesas: "", regularizable: "",
  alcohol: "", alcoholSinComida: "", vendeAlcohol: "", pctAlcohol: "", deudaPermisos: "", deudaPermisosMonto: "", patenteGiro: "",
  eerr: "", flujoCaja: "", conciliacion: "", pctRespaldo: "", remuneracionesAlDia: "", ctaCorriente: "",
  lineaCredito: "", lineaCupo: "", lineaUsado: "", tarjetaCredito: "", tarjetaCupo: "", tarjetaUsado: "", saldoCuenta: "",
  deudaFinanciera: "", deudaFinancieraMonto: "", deudaLaboral: "", deudaLaboralMonto: "", morosidades: "",
  f29AlDia: "", balance: "", preBalance: "", contador: "", carpetaTributaria: "", certificadoTgr: "", deudaTributaria: "", deudaTributariaMonto: "",
  sistemas: "", deudaSistemas: "", deudaSistemasMonto: "",
  instagram: "", tiktok: "", facebook: "", notaGoogle: "", resenasGoogle: "", marcaInapi: "",
  carpetaToken: "", carpetaEstado: "", carpetaVentas12: "", carpetaCompras12: "", carpetaVentasAnt12: "", carpetaMeses: "", carpetaUltimo: "", carpetaRazon: "",
  deudas: "", deudasMonto: "",
};

// ---------- Las 11 dimensiones: peso y por qué pesa eso (se muestra en el formulario y en el certificado) ----------
export type IdDim = "negocio" | "arriendo" | "equipos" | "ubicacion" | "entorno" | "local" | "permisos" | "financiero" | "tributario" | "sistemas" | "redes";
export const DIMENSIONES: { id: IdDim; n: number; titulo: string; max: number; porQue: string; deuda?: string }[] = [
  { id: "negocio", n: 1, titulo: "El negocio", max: 15,
    porQue: "La utilidad define el valor base; estos puntos premian que esa utilidad sea sana (margen), probada en el tiempo (años), creciente y que no dependa de la persona del dueño, que es lo que el comprador no se lleva." },
  { id: "arriendo", n: 2, titulo: "Contrato de arriendo", max: 15, deuda: "con el arrendador (rentas, gastos comunes o servicios)",
    porQue: "Un derecho de llave existe mientras exista el local. El plazo que queda, el peso del arriendo sobre la venta y la posibilidad de ceder o renovar el contrato son el principal riesgo del comprador en Chile." },
  { id: "equipos", n: 3, titulo: "Equipos e inventario", max: 7, deuda: "por los equipos (leasing, créditos, prendas o cuotas)",
    porQue: "Los equipos son necesarios para operar, pero se pueden comprar: pesan menos que lo que no se puede reemplazar. Su valor depreciado funciona además como piso del precio." },
  { id: "ubicacion", n: 4, titulo: "Ubicación", max: 4,
    porQue: "El flujo de personas y autos explica buena parte de la venta y no se puede copiar." },
  { id: "entorno", n: 5, titulo: "Entorno", max: 5,
    porQue: "Lo que rodea al local decide qué tan segura es la venta: una tienda ancla trae público propio todos los días, una venta pareja todo el año es predecible y la competencia a pocos metros reparte a los clientes. Además de los puntos, el entorno ajusta directamente el valor (entre −14% y +13%)." },
  { id: "local", n: 6, titulo: "El local", max: 4,
    porQue: "El estado del local y los estacionamientos afectan cuánto más tendrá que invertir el comprador, más que la utilidad del negocio." },
  { id: "permisos", n: 7, titulo: "Patentes y permisos", max: 15, deuda: "por patentes, derechos municipales o multas",
    porQue: "Un permiso que falta o que no calza con cómo opera el local puede cerrar el negocio de un día para otro: es un riesgo de todo o nada, por eso pesa tanto y pone un techo al puntaje total." },
  { id: "financiero", n: 8, titulo: "Estado financiero", max: 15, deuda: "con bancos, proveedores o tarjetas",
    porQue: "Lo que se puede demostrar vale más. Estados de resultados, flujo de caja, conciliaciones y ventas con respaldo convierten una cifra declarada en una cifra comprobable, que es lo que piden compradores y bancos." },
  { id: "tributario", n: 9, titulo: "Situación tributaria", max: 10, deuda: "con el SII o la Tesorería (impuestos, multas o convenios)",
    porQue: "Quien compra un establecimiento queda como fiador de los impuestos del negocio (Código Tributario, art. 71). Impuestos al día, balances y un contador responsable reducen ese riesgo." },
  { id: "sistemas", n: 10, titulo: "Sistemas y procesos", max: 7, deuda: "por sistemas o software (licencias o arriendo de equipos de venta)",
    porQue: "Un negocio con sistemas y procesos escritos lo puede operar otra persona desde el primer día; uno que vive en la cabeza del dueño pierde valor al venderse." },
  { id: "redes", n: 11, titulo: "Redes sociales y marca", max: 3,
    porQue: "La reputación digital y la marca registrada suman, pero son lo más fácil de reconstruir para un nuevo dueño." },
];

export type Item = { t: string; pts: number; max: number; nota?: string };
export type Dimension = {
  id: IdDim; n: number; titulo: string; max: number; porQue: string;
  puntos: number;            // después de la penalización por deuda
  bruto: number;             // antes de la penalización por deuda
  items: Item[];
  deuda: number;             // monto declarado en esta dimensión
  penalizacion: number;      // puntos restados por deuda
  respondida: boolean;
  mejoras: string[];
  efectoValor?: { t: string; pct: number }[]; // entorno: ajustes directos al valor (además de los puntos)
};

export type Resultado = {
  listo: boolean;              // hay venta, utilidad y meses de contrato
  listoInicial: boolean;       // hay venta y utilidad (etapa 1)
  dimensiones: Dimension[];
  puntaje: number;             // 0 a 100, con techos por permisos
  puntajeSinTecho: number;
  techo: { valor: number; motivo: string } | null;
  factor: number;              // factor de calidad
  utilidad: number;            // utilidad mensual declarada (ajustada por alcohol sin patente)
  sueldoReemplazo: number;
  utilidadNormalizada: number;
  ventaNeta: number;
  ventaAjustada: number;       // venta bruta usada (compatibilidad)
  ajustes: string[];
  tamano: "pequeño" | "mediano" | "grande";
  multiplo: number;
  sectorMercado: string;
  base: number;                // utilidad normalizada × 12 × múltiplo
  ajustado: number;            // base × factor
  topeContrato: number;
  mesesTopeContrato: number;
  topeAplicado: boolean;
  mesesContrato: number;    // meses que quedan + renovación por escrito
  mesesRenovacion: number;
  pctTope: number;          // 0,4 Standard o 0,5 verificado
  conEntorno: number;       // base × factor + entorno, antes del tope
  conTope: number;          // valor operacional antes del piso (topado + prima − marca)
  piso: number;                // valor de los equipos
  pisoAplicado: boolean;
  operacional: number;
  mercaderia: number;
  vehiculos: number;
  deudas: { t: string; monto: number }[];
  totalDeudas: number;
  valorAntesDeudas: number;
  valor: number;
  estimacionInicial: number;   // solo con la etapa 1: utilidad normalizada × 12 × múltiplo
  puntosObtenidos: number;     // suma de puntos de las preguntas que aplican
  puntosAplicables: number;    // máximo posible según lo que se vende (el puntaje se lleva a base 100)
  alcance: { razonSocial: boolean; cuenta: boolean; trabajadores: boolean; marca: boolean; redes: boolean; definido: boolean };
  descuentoMarca: number;      // pesos: −10% en comida y retail si la marca no se vende
  entorno: { pct: number; monto: number; lineas: { t: string; pct: number }[] }; // ajuste por entorno (después del tope)
  prima: { nivel: NivelVerificado | null; pct: number; monto: number };            // prima por información verificada
  saldoCaja: number;           // saldo en cuenta corriente que se suma al cierre si se traspasa (no está en `valor`)
  sii: null | {                // ventas verificadas con la carpeta tributaria
    estado: "leida" | "revision" | "verificada";
    ventaMensual: number; compraMensual: number; declarada: number; diferencia: number | null; meses: number; ultimo: string;
    ventasAnual: number; comprasAnual: number; ventasAnualAnterior: number | null; coincide: boolean;
  };
  mesesRecupero: number;
};

const n = (v?: string) => Math.max(0, Number(String(v ?? "").replace(/\D/g, "")) || 0);
const pctN = (v?: string) => Math.min(100, Math.max(0, Number(String(v ?? "").replace(",", ".").replace(/[^\d.]/g, "")) || 0));
const r1 = (x: number) => Math.round(x * 10) / 10;
export const clp = (v: number) => (v < 0 ? "−$" : "$") + Math.round(Math.abs(v)).toLocaleString("es-CL");
export function fmtMeses(m: number) {
  const t = Number.isInteger(m) ? String(Math.abs(m)) : Math.abs(m).toFixed(1).replace(".", ",");
  return `${m < 0 ? "−" : "+"}${t} ${Math.abs(m) === 1 ? "mes" : "meses"}`;
}
export const fmtPts = (x: number) => (Number.isInteger(r1(x)) ? String(r1(x)) : r1(x).toFixed(1).replace(".", ","));

// La resolución sanitaria coincide con cómo opera el local (los locales al paso y las panaderías no pueden tener mesas).
export const sinMesasPermitidas = (t: TipoResolucion) => t === "paso" || t === "panaderia";
export const fueraDeNorma = (d: Pick<DatosValorizacion, "tipoResolucion" | "mesas">) => sinMesasPermitidas(d.tipoResolucion) && d.mesas === "si";
export const ventaBruta = (d: DatosValorizacion) => (d.ventaNeta ? n(d.ventaNeta) * 1.19 : n(d.ventaMensual));
const ventaNetaDe = (d: DatosValorizacion) => (d.ventaNeta ? n(d.ventaNeta) : n(d.ventaMensual) / 1.19);

// Rubros donde la marca pesa en la clientela (comida y retail): sin ella, −10% al valor.
export const RUBROS_MARCA = ["Cafetería", "Restaurante", "Panadería", "Botillería", "Minimarket", "Retail y tiendas"];
export const DESCUENTO_SIN_MARCA = 0.1;

// Entorno (13 oct 2026): ajustes directos al valor, además de los puntos de la dimensión. Se aplican después del tope
// por contrato, igual que el descuento por marca. Sin tienda ancla no hay ajuste (ni a favor ni en contra).
export const AJUSTES_ENTORNO = {
  anclaCentro: 0.08,       // tienda ancla en el mismo strip center, mall o galería
  anclaCerca: 0.05,        // tienda ancla a menos de 100 m (local a la calle)
  ventasParejas: 0.03,     // ventas parejas todo el año: flujo predecible
  ventasDeTemporada: -0.1, // la venta depende de una temporada (p. ej. solo verano)
  sinCompetencia: 0.02,    // ningún competidor directo a menos de 500 m
  muchaCompetencia: -0.04, // 3 o más competidores directos a menos de 500 m
  min: -0.15, max: 0.15,
};
// Prima por información verificada (13 oct 2026): certificados Gold y Platinum cuyos documentos Nico Pacheco
// revisó y coinciden con lo declarado. Las mismas cifras respaldadas valen más: el comprador se ahorra validarlas
// y corre menos riesgo (Platinum descarta además deudas tributarias, laborales y comerciales ocultas).
export type NivelVerificado = "gold" | "platinum";
export const PRIMA_VERIFICACION: Record<NivelVerificado, number> = { gold: 0.05, platinum: 0.1 };

export const TIPOS_ENTORNO: [Exclude<DatosValorizacion["entornoTipo"], "">, string][] = [
  ["calle", "Local a la calle"], ["strip", "Strip center"], ["mall", "Mall o centro comercial"], ["galeria", "Galería comercial"],
];
export const pctTxt = (x: number) => `${x > 0 ? "+" : "−"}${Math.round(Math.abs(x) * 100)}%`;

export function ajustesEntorno(d: DatosValorizacion): { t: string; pct: number }[] {
  const A = AJUSTES_ENTORNO, out: { t: string; pct: number }[] = [];
  if (d.tiendaAncla === "si") {
    const centro = d.entornoTipo === "strip" || d.entornoTipo === "mall" || d.entornoTipo === "galeria";
    const nombre = d.tiendaAnclaNombre?.trim();
    const donde = centro ? `en el mismo ${d.entornoTipo === "strip" ? "strip center" : d.entornoTipo === "mall" ? "centro comercial" : "galería"}` : "a menos de 100 metros";
    out.push({ t: `Tienda ancla${nombre ? ` (${nombre})` : ""} ${donde}: trae público propio todos los días`, pct: centro ? A.anclaCentro : A.anclaCerca });
  }
  if (d.estacionalidad === "pareja") out.push({ t: "Ventas parejas todo el año: flujo predecible y menos riesgo para el comprador", pct: A.ventasParejas });
  if (d.estacionalidad === "alta") out.push({ t: "La venta depende de una temporada: meses flojos con los mismos costos fijos y más capital de trabajo", pct: A.ventasDeTemporada });
  if (d.competencia === "ninguna") out.push({ t: "Sin competidores directos a menos de 500 metros", pct: A.sinCompetencia });
  if (d.competencia === "mucha") out.push({ t: "3 o más competidores directos a menos de 500 metros: la clientela se reparte y presiona los precios", pct: A.muchaCompetencia });
  return out;
}

// Factor de calidad según puntaje: tramos lineales (0 → 0,60 · 30 → 0,75 · 70 → 1,00 · 100 → 1,20).
const TRAMOS: [number, number][] = [[0, 0.6], [30, 0.75], [70, 1], [100, 1.2]];
export function factorCalidad(p: number) {
  const x = Math.max(0, Math.min(100, p));
  for (let i = 1; i < TRAMOS.length; i++) {
    const [p0, f0] = TRAMOS[i - 1], [p1, f1] = TRAMOS[i];
    if (x <= p1) return f0 + ((x - p0) / (p1 - p0)) * (f1 - f0);
  }
  return 1.2;
}

// Penalización por deuda dentro de la dimensión: desde 15% de sus puntos si hay cualquier deuda, hasta 60% si la deuda
// llega a 2 meses de utilidad o más. Además el monto se descuenta completo del valor final.
function penalizarDeuda(bruto: number, deuda: number, U: number, hay: boolean) {
  if (!hay) return 0;
  const rel = U > 0 ? deuda / (2 * U) : 1;
  return bruto * Math.min(0.6, 0.15 + 0.45 * Math.min(1, rel));
}

// Vehículos (17 oct, decidido con Nico): precio nuevo depreciado en línea recta 8% por año, hasta un mínimo de 20% del
// precio nuevo a los 10 años. Ej.: nuevo $20.000.000 con 10 años de uso → $4.000.000.
// Equipos: valor hoy = precio nuevo ÷ (años de uso + 1), máximo ÷5. Es el «piso» del precio y el precio de venta de cada
// ítem del inventario detallado (lib/inventario.ts).
export const factorEquipos = (anos: number) => 1 / Math.min(5, Math.max(0, anos) + 1);
export const DEPRECIACION_VEHICULOS = { porAno: 0.08, minimo: 0.2 };
// Siempre se cuenta al menos 1 año de uso, aunque esté recién comprado (un vehículo pierde valor al salir de la automotora).
export const factorVehiculo = (anos: number) => Math.max(DEPRECIACION_VEHICULOS.minimo, 1 - DEPRECIACION_VEHICULOS.porAno * Math.max(1, anos));
export function valorVehiculos(d: Pick<DatosValorizacion, "vehiculos" | "vehiculosNuevo" | "vehiculosAnos">) {
  const nuevo = Math.max(0, Number(String(d.vehiculosNuevo ?? "").replace(/\D/g, "")) || 0);
  if (d.vehiculos !== "si" || !nuevo) return 0;
  return Math.round(nuevo * factorVehiculo(Number(String(d.vehiculosAnos ?? "").replace(",", ".")) || 0));
}

// Tope por contrato (17 oct 2026, decidido con Nico): el comprador debe recuperar su inversión antes de la mitad del
// contrato que le queda; la otra mitad es su ganancia. Sin documentos se exige recuperar antes (40%) por el riesgo de
// cifras no acreditadas; con la valorización Gold o Platinum verificada, 50%. La renovación por escrito suma 12 meses.
export const TOPE_CONTRATO = { declarado: 0.4, verificado: 0.5, mesesRenovacion: 12 };

export function valorizar(d: DatosValorizacion, opt: { verificado?: NivelVerificado | null } = {}): Resultado {
  // ---------- Venta y utilidad ----------
  const ajustes: string[] = [];
  let fAlcohol = 1;
  if (d.alcohol === "ninguna" && d.vendeAlcohol === "si" && pctN(d.pctAlcohol) > 0) {
    fAlcohol = 1 - pctN(d.pctAlcohol) / 100;
    ajustes.push(`${Math.round(pctN(d.pctAlcohol))}% de la venta es alcohol vendido sin patente: esa venta y su utilidad no se consideran`);
  }
  // Ventas verificadas con la carpeta tributaria del SII: reemplazan la venta escrita a mano.
  const mesesSII = Math.min(12, n(d.carpetaMeses));
  const leidaSII = (d.carpetaEstado === "leida" || d.carpetaEstado === "verificada") && n(d.carpetaVentas12) > 0 && mesesSII > 0;
  const ventaSII = leidaSII ? n(d.carpetaVentas12) / mesesSII : 0;
  const compraSII = leidaSII ? n(d.carpetaCompras12) / mesesSII : 0;
  const declarada = ventaNetaDe(d);
  const diferencia = leidaSII && declarada ? declarada / ventaSII - 1 : null;
  if (leidaSII && diferencia !== null && Math.abs(diferencia) > 0.1)
    ajustes.push(`La venta escrita (${clp(declarada)} al mes) ${diferencia > 0 ? "supera" : "es menor que"} en ${Math.round(Math.abs(diferencia) * 100)}% la declarada al SII (${clp(ventaSII)}): se usa la del SII`);
  let U = n(d.utilidadMensual) * fAlcohol;
  const neta = (leidaSII ? ventaSII : declarada) * fAlcohol;
  // La utilidad no puede ser mayor que la venta menos las compras con IVA (los demás gastos solo la bajan).
  if (leidaSII && compraSII > 0 && U > (ventaSII - compraSII) * fAlcohol) {
    ajustes.push(`La utilidad escrita (${clp(U)}) es mayor que la venta menos las compras declaradas al SII (${clp((ventaSII - compraSII) * fAlcohol)}): se usa ese máximo`);
    U = Math.max(0, (ventaSII - compraSII) * fAlcohol);
  }
  const sueldo = d.utilidadConSueldo === "no" ? n(d.sueldoReemplazo) : 0;
  if (sueldo) ajustes.push(`La utilidad no descuenta el trabajo del dueño: se restan ${clp(sueldo)} al mes, lo que costaría reemplazarlo`);
  const UN = Math.max(0, U - sueldo);
  const R = n(d.mesesRestantes);
  const deudaDe = (sn: SN, monto: string) => (sn === "si" ? n(monto) : 0);
  const dims: Dimension[] = [];
  // Qué se vende: sin respuesta se asume la venta más común en Chile (solo el negocio, sin la empresa).
  const RS = d.conRazonSocial === "si";
  const CTA = RS && d.conCuenta === "si";
  const TRAB = RS || d.trabajadoresPasan === "si";
  const MARCA = d.conMarca !== "no";
  const REDES = MARCA && d.conRedes !== "no";
  const lineaUsada = CTA && d.lineaCredito === "si" ? n(d.lineaUsado) : 0;
  const tarjetaUsada = CTA && d.tarjetaCredito === "si" ? n(d.tarjetaUsado) : 0;

  const crear = (id: IdDim, items: Item[], extra: { deuda?: number; hayDeuda?: boolean; respondida: boolean; mejoras: string[] }) => {
    const def = DIMENSIONES.find((x) => x.id === id)!;
    const max = items.reduce((s, x) => s + x.max, 0);
    const bruto = Math.min(max, items.reduce((s, x) => s + x.pts, 0));
    const pen = penalizarDeuda(bruto, extra.deuda ?? 0, UN || U, Boolean(extra.hayDeuda));
    if (extra.hayDeuda) extra.mejoras.unshift(`Pagar o repactar la deuda ${def.deuda} (${clp(extra.deuda ?? 0)}) antes de vender.`);
    dims.push({ ...def, max, items, bruto, penalizacion: pen, puntos: Math.max(0, bruto - pen), deuda: extra.deuda ?? 0, respondida: extra.respondida, mejoras: extra.mejoras });
  };

  // ---------- 1. El negocio (15) ----------
  {
    const m: string[] = [];
    const margen = neta > 0 ? (U / neta) * 100 : 0;
    const pm = !U || !neta ? 0 : margen >= 20 ? 4 : margen >= 15 ? 3.2 : margen >= 10 ? 2.4 : margen >= 5 ? 1.2 : 0;
    const anos = n(d.anosFuncionando);
    const pa = d.anosFuncionando === "" ? 0 : anos >= 5 ? 3 : anos >= 3 ? 2 : anos >= 1 ? 1 : 0;
    const antSII = leidaSII && n(d.carpetaVentasAnt12) ? n(d.carpetaVentasAnt12) / 12 : 0;
    const ant = antSII || n(d.ventaNetaAnterior);
    const actual = antSII ? n(d.carpetaVentas12) / 12 : neta;
    const cre = ant > 0 && actual > 0 ? (actual / ant - 1) * 100 : null;
    const pc = cre === null ? 1 : cre >= 10 ? 3 : cre >= 0 ? 2 : cre >= -10 ? 1 : 0;
    const pd = { baja: 3, media: 1.5, alta: 0, "": 0 }[d.dependenciaDueno];
    // Eficiencia (17 oct): venta neta mensual por persona que trabaja, dueño incluido. Con menos personas para la misma
    // venta, el costo de personal pesa menos y queda más utilidad estable para el comprador.
    const personas = n(d.trabajadores);
    const vpp = personas && neta ? neta / personas : 0;
    const pef = !vpp ? 0 : vpp >= 4_500_000 ? 2 : vpp >= 3_000_000 ? 1.5 : vpp >= 2_000_000 ? 0.75 : 0;
    if (pm < 4) m.push("Mejorar el margen: revisar costos de mercadería, mermas y personal.");
    if (cre === null) m.push("Informar la venta de hace 12 meses para demostrar crecimiento.");
    if (vpp && pef < 1.5) m.push("Revisar turnos y tareas: con la venta actual, el negocio usa más personas de lo que suele necesitar uno eficiente del mismo tamaño.");
    if (pd < 3) m.push("Delegar la operación en un administrador y documentar las tareas del dueño.");
    crear("negocio", [
      { t: "Margen de utilidad (EBITDA ÷ venta neta)", pts: pm, max: 4, nota: U && neta ? `${margen.toFixed(1).replace(".", ",")}%` : "sin datos" },
      { t: "Años funcionando", pts: pa, max: 3, nota: d.anosFuncionando ? `${anos} años` : "sin dato" },
      { t: "Crecimiento de la venta en 12 meses", pts: pc, max: 3, nota: cre === null ? "sin dato: se asume estable" : `${cre >= 0 ? "+" : ""}${cre.toFixed(1).replace(".", ",")}%${antSII ? " (según el SII)" : ""}` },
      { t: "Eficiencia: venta neta por persona que trabaja", pts: pef, max: 2, nota: vpp ? `${clp(vpp)} al mes por persona (${personas} ${personas === 1 ? "persona" : "personas"})` : "sin dato" },
      { t: "Funciona sin depender del dueño", pts: pd, max: 3, nota: { baja: "funciona con un administrador", media: "el dueño trabaja parte del día", alta: "depende totalmente del dueño", "": "sin dato" }[d.dependenciaDueno] },
    ], { respondida: Boolean(U && neta), mejoras: m });
  }

  // ---------- 2. Contrato de arriendo (15) ----------
  {
    const m: string[] = [];
    const pr = !d.mesesRestantes ? 0 : R >= 60 ? 5 : R >= 36 ? 4 : R >= 24 ? 3 : R >= 12 ? 1.5 : 0;
    // Costo total de ocupar el local: arriendo + gasto común + otros cobros del arrendador.
    const arr = n(d.arriendo) + n(d.gastoComun) + (d.otrosCobros === "si" ? n(d.otrosCobrosMonto) : 0);
    const pct = n(d.arriendo) && neta ? (arr / neta) * 100 : null;
    const pa = pct === null ? 0 : pct < 5 ? 4 : pct <= 8 ? 3 : pct <= 10 ? 2 : pct <= 15 ? 1 : 0;
    const pren = d.renovacion === "si" ? 1.5 : 0;
    const pterm = d.terminoAnticipado === "no" ? 1 : 0;
    const pces = RS ? 3 : { si: 3, conversacion: 1.5, no: 0, "": 0 }[d.autorizaCesion];
    const pnot = d.contratoNotarial === "si" ? 0.5 : 0;
    if (d.terminoAnticipado === "si") m.push("Negociar que el arrendador no pueda terminar el contrato antes sin causa: es el mayor riesgo para quien compra.");
    m.push(`Firmar un anexo que alargue el contrato: cada 12 meses más suben el máximo que se puede pedir en ${clp(UN * 12 * (opt.verificado ? TOPE_CONTRATO.verificado : TOPE_CONTRATO.declarado))}.`);
    if (!RS && pces < 3) m.push("Conseguir por escrito la autorización del arrendador para ceder el contrato al comprador.");
    if (!pren) m.push("Pedir una cláusula de renovación en el contrato.");
    crear("arriendo", [
      { t: "Meses que quedan de contrato", pts: pr, max: 5, nota: d.mesesRestantes ? `${R} meses` : "sin dato" },
      { t: n(d.gastoComun) || d.otrosCobros === "si" ? "Arriendo, gasto común y otros cobros sobre la venta neta" : "Arriendo sobre la venta neta", pts: pa, max: 4, nota: pct === null ? "sin datos" : `${pct.toFixed(1).replace(".", ",")}%` },
      { t: "Opción de renovar el contrato", pts: pren, max: 1.5 },
      { t: "El arrendador no puede terminarlo antes sin causa", pts: pterm, max: 1, nota: { si: "puede terminarlo con solo avisar", no: "no puede", "": "sin dato" }[d.terminoAnticipado ?? ""] },
      RS
        ? { t: "Contrato a nombre de la empresa que se vende (no requiere cesión)", pts: pces, max: 3 }
        : { t: "Autorización para ceder o subarrendar", pts: pces, max: 3, nota: { si: "sí, por escrito", conversacion: "en conversación", no: "no", "": "sin dato" }[d.autorizaCesion] },
      { t: "Contrato firmado ante notario", pts: pnot, max: 0.5 },
    ], { deuda: deudaDe(d.deudaArriendo, d.deudaArriendoMonto), hayDeuda: d.deudaArriendo === "si", respondida: Boolean(d.mesesRestantes && d.arriendo), mejoras: m });
  }

  // ---------- 3. Equipos e inventario (7) ----------
  const inv = n(d.inventarioNuevo);
  const uso = n(d.anosUso);
  const piso = inv * factorEquipos(uso); // = inv ÷ mín(5, años + 1)
  {
    const m: string[] = [];
    const pu = !inv ? 0 : uso <= 2 ? 3 : uso <= 5 ? 2 : uso <= 9 ? 1 : 0;
    const pf = d.equiposFacturas === "si" ? 2 : 0;
    const pmn = d.mantenciones === "si" ? 2 : 0;
    const conVehiculos = d.vehiculos === "si";
    if (conVehiculos && d.vehiculosAlDia !== "si") m.push("Poner al día los papeles de los vehículos (permiso de circulación, revisión técnica y SOAP) y confirmar que no tienen prenda.");
    if (!pf) m.push("Reunir las facturas de los equipos y confirmar que ninguno está en comodato.");
    if (!pmn) m.push("Registrar las mantenciones de los equipos principales.");
    crear("equipos", [
      { t: "Antigüedad de los equipos", pts: pu, max: 3, nota: inv ? `${uso} años de uso` : "sin datos" },
      { t: "Equipos propios con facturas", pts: pf, max: 2 },
      { t: "Mantenciones al día", pts: pmn, max: 2 },
      ...(conVehiculos ? [{ t: "Vehículos con papeles al día y sin prenda", pts: d.vehiculosAlDia === "si" ? 1 : 0, max: 1, nota: valorVehiculos(d) ? `valor hoy ${clp(valorVehiculos(d))}` : undefined }] : []),
    ], { deuda: deudaDe(d.deudaEquipos, d.deudaEquiposMonto), hayDeuda: d.deudaEquipos === "si", respondida: Boolean(inv || d.equiposFacturas), mejoras: m });
  }

  // ---------- 4. Ubicación (4) ----------
  {
    const pp = { alto: 2.5, regular: 1.5, bajo: 0, "": 0 }[d.peatonal];
    const pv = { alto: 1.5, regular: 0.75, bajo: 0, "": 0 }[d.vehicular];
    crear("ubicacion", [
      { t: "Flujo peatonal", pts: pp, max: 2.5, nota: d.peatonal || "sin dato" },
      { t: "Flujo vehicular", pts: pv, max: 1.5, nota: d.vehicular || "sin dato" },
    ], { respondida: Boolean(d.peatonal || d.vehicular), mejoras: [] });
  }

  // ---------- 5. Entorno (5 + ajuste directo al valor) ----------
  const efectoEntorno = ajustesEntorno(d);
  {
    const m: string[] = [];
    const pc = { ninguna: 2.5, poca: 1.5, mucha: 0.5, "": 0 }[d.competencia];
    const pe = { pareja: 2.5, temporada: 1.5, alta: 0, "": 0 }[d.estacionalidad];
    if (d.estacionalidad === "alta") m.push("Mostrar al comprador las ventas mes a mes de 2 años (la temporada baja incluida) y sumar productos o servicios para los meses flojos.");
    if (d.estacionalidad === "temporada") m.push("Tener a mano las ventas mes a mes: el comprador querrá ver cuánto baja la temporada floja.");
    if (d.competencia === "mucha") m.push("Explicar qué diferencia al negocio de los competidores cercanos (producto, precio, servicio o clientes fieles).");
    const tipo = TIPOS_ENTORNO.find(([k]) => k === d.entornoTipo)?.[1];
    crear("entorno", [
      { t: "Competidores directos a menos de 500 m", pts: pc, max: 2.5, nota: { ninguna: "ninguno", poca: "1 o 2", mucha: "3 o más", "": "sin dato" }[d.competencia] },
      { t: "Ventas durante el año", pts: pe, max: 2.5, nota: { pareja: "parejas todo el año", temporada: "suben en una temporada", alta: "dependen de una temporada", "": "sin dato" }[d.estacionalidad] },
    ], { respondida: Boolean(d.competencia || d.estacionalidad || d.entornoTipo), mejoras: m });
    const dm = dims[dims.length - 1];
    dm.efectoValor = [
      ...(tipo ? [{ t: `${tipo}${d.tiendaAncla === "no" ? ", sin tienda ancla cercana" : ""}`, pct: 0 }] : []),
      ...efectoEntorno,
      ...(d.estacionalidad === "temporada" ? [{ t: "Ventas que suben en una temporada, pero se vende todo el año", pct: 0 }] : []),
      ...(d.competencia === "poca" ? [{ t: "1 o 2 competidores directos a menos de 500 metros", pct: 0 }] : []),
    ];
  }

  // ---------- 6. El local (4) ----------
  {
    const pi = { nuevo: 3, bueno: 2, mantencion: 0, "": 0 }[d.infraestructura];
    const est = n(d.estacionamientos);
    const enCentro = d.stripCenter === "si" || d.entornoTipo === "strip" || d.entornoTipo === "mall";
    const pe = enCentro || est >= 2 ? 1 : est === 1 ? 0.5 : 0;
    crear("local", [
      { t: "Estado de la infraestructura", pts: pi, max: 3, nota: { nuevo: "como nuevo", bueno: "usado, buen estado", mantencion: "requiere mantención", "": "sin dato" }[d.infraestructura] },
      { t: "Estacionamientos", pts: pe, max: 1, nota: enCentro ? (d.entornoTipo === "mall" ? "los del centro comercial" : "strip center") : `${est} exclusivos` },
    ], { respondida: Boolean(d.infraestructura), mejoras: pi < 2 ? ["Hacer las mantenciones pendientes del local antes de mostrarlo."] : [] });
  }

  // ---------- 7. Patentes y permisos (15) ----------
  const tipo: TipoResolucion = d.tipoResolucion || (d.sanitaria === "si" ? "otro" : d.sanitaria === "no" ? "no" : "");
  const mef = d.mef === "si";
  const fuera = fueraDeNorma({ tipoResolucion: tipo, mesas: d.mesas });
  let techo: { valor: number; motivo: string } | null = null;
  const conTecho = (v: number, motivo: string) => { if (!techo || v < techo.valor) techo = { valor: v, motivo }; };
  {
    const m: string[] = [];
    let pm = 0, nm = "sin dato";
    if (d.patente === "definitiva" && !mef) { pm = 6; nm = "definitiva"; }
    else if (d.patente === "provisoria" && !mef) { pm = 3; nm = "provisoria"; m.push("Obtener la patente definitiva antes de vender."); }
    else if (d.patente === "no") { pm = 0; nm = "sin patente"; conTecho(40, "no tiene patente municipal"); m.push("Regularizar la patente municipal: sin ella el negocio puede ser clausurado."); }
    else if (d.patente && mef) {
      const def = d.patente === "definitiva";
      pm = d.mefViveAhi === "si" ? (def ? 4 : 2) : d.mefViveAhi === "no" ? (def ? 1 : 0) : 1;
      nm = `Microempresa Familiar ${def ? "definitiva" : "provisoria"}${d.mefViveAhi === "si" ? ", el comprador podría vivir ahí" : d.mefViveAhi === "no" ? ", el comprador no podría vivir ahí" : ""}`;
      if (d.mefExcede === "si") { pm = Math.max(0, pm - 2); nm += "; supera los límites MEF"; }
      m.push("Evaluar una patente comercial normal: la MEF está amarrada a la casa y a quien vive en ella.");
    }
    if (d.patenteGiro === "no" && d.patente && d.patente !== "no") { pm = Math.max(0, pm - 2); nm += "; el giro no cubre todo lo que vende"; m.push("Ampliar el giro de la patente para que cubra todo lo que vende el negocio."); }
    let ps = 0, ns = "sin dato";
    const valorTipo = { restaurante: 6, cafeteria: 5.5, panaderia: 5, otro: 5, paso: 4, no: 0, "": 0 } as const;
    if (tipo === "no") { ps = 0; ns = "sin resolución"; conTecho(40, "no tiene resolución sanitaria"); m.push("Obtener la resolución sanitaria en la SEREMI de Salud."); }
    else if (tipo && fuera) { ps = d.regularizable === "no" ? 0 : 2; ns = `${TIPOS_RESOLUCION.find(([k]) => k === tipo)?.[1]} pero atiende con mesas${d.regularizable === "no" ? ", no regularizable" : ", regularizable"}`; m.push("Regularizar la resolución sanitaria para atender con mesas, o retirarlas."); if (d.regularizable === "no") conTecho(55, "la resolución sanitaria no calza con cómo opera el local"); }
    else if (tipo) { ps = valorTipo[tipo]; ns = TIPOS_RESOLUCION.find(([k]) => k === tipo)?.[1] ?? ""; }
    let pal = 0, nal = "sin dato";
    if (d.alcohol === "limitada") { pal = 3; nal = "patente limitada (escasa)"; }
    else if (d.alcohol === "c") {
      if (d.alcoholSinComida === "si") { pal = 0.5; nal = "patente C funcionando como bar"; m.push("Vender alcohol solo con comida, como exige la patente C."); }
      else if (tipo === "restaurante" || tipo === "cafeteria") { pal = 2.5; nal = "patente C de restaurante"; }
      else { pal = 1; nal = "patente C sin resolución de restaurante o cafetería"; }
    } else if (d.alcohol === "ninguna") {
      if (d.vendeAlcohol === "si") { pal = 0; nal = "vende alcohol sin patente"; conTecho(50, "vende alcohol sin patente"); m.push("Dejar de vender alcohol sin patente (Ley 19.925)."); }
      else { pal = 1.5; nal = "no vende alcohol"; }
    }
    crear("permisos", [
      { t: "Patente municipal", pts: pm, max: 6, nota: nm },
      { t: "Resolución sanitaria", pts: ps, max: 6, nota: ns },
      { t: "Patente de alcoholes", pts: pal, max: 3, nota: nal },
    ], { deuda: deudaDe(d.deudaPermisos, d.deudaPermisosMonto), hayDeuda: d.deudaPermisos === "si", respondida: Boolean(d.patente && tipo), mejoras: m });
  }

  // ---------- 8. Estado financiero (15) ----------
  {
    const m: string[] = [];
    const pe = { si: 4, parcial: 2, no: 0, "": 0 }[d.eerr];
    const pf = d.flujoCaja === "si" ? 1.5 : 0;
    const pc = d.conciliacion === "si" ? 1.5 : 0;
    const pmor = d.morosidades === "no" ? 1 : 0;
    if (d.morosidades === "si") m.push("Pagar o repactar las morosidades y protestos del informe comercial antes de vender.");
    const resp = d.pctRespaldo === "" ? null : pctN(d.pctRespaldo);
    const pr = leidaSII ? 3 : resp === null ? 0 : resp >= 90 ? 3 : resp >= 70 ? 2 : resp >= 50 ? 1 : 0;
    const coincide = leidaSII && (diferencia === null || Math.abs(diferencia) <= 0.1);
    const psii = coincide ? 3 : leidaSII ? 1.5 : d.carpetaEstado === "revision" ? 1 : 0;
    if (!leidaSII && d.carpetaEstado !== "revision") m.push("Subir la carpeta tributaria del SII: las ventas quedan verificadas y el comprador puede creerlas.");
    const prem = d.remuneracionesAlDia === "si" ? 2 : 0;
    if (pe < 4) m.push("Preparar estados de resultados mensuales de los últimos 12 meses.");
    if (!pc) m.push("Conciliar mensualmente la cuenta bancaria con las ventas y gastos.");
    if (pr < 3) m.push("Aumentar la venta con respaldo (boleta, factura o tarjeta): es la que el comprador puede creer.");
    const dFin = RS ? deudaDe(d.deudaFinanciera, d.deudaFinancieraMonto) : 0;
    const dLab = TRAB ? deudaDe(d.deudaLaboral, d.deudaLaboralMonto) : 0;
    const deuda = dFin + dLab + lineaUsada + tarjetaUsada;
    if (TRAB && d.deudaLaboral === "si") m.push(`Pagar sueldos, cotizaciones o finiquitos pendientes (${clp(n(d.deudaLaboralMonto))}): los contratos siguen con el comprador (Código del Trabajo, art. 4).`);
    crear("financiero", [
      { t: "Estados de resultados mensuales (12 meses)", pts: pe, max: 4, nota: { si: "sí", parcial: "parciales", no: "no", "": "sin dato" }[d.eerr] },
      { t: "Flujo de caja", pts: pf, max: 1.5 },
      { t: "Conciliación bancaria mensual", pts: pc, max: 1.5 },
      { t: "Informe comercial (Dicom) sin morosidades ni protestos", pts: pmor, max: 1, nota: { si: "tiene morosidades o protestos", no: "limpio", "": "sin dato" }[d.morosidades ?? ""] },
      { t: "Ventas verificadas con la carpeta tributaria del SII", pts: psii, max: 3, nota: coincide ? `coinciden con los F29 de ${mesesSII} meses` : leidaSII ? "la venta escrita no coincide con la declarada al SII" : d.carpetaEstado === "revision" ? "carpeta en revisión" : "sin carpeta" },
      { t: "Venta con respaldo (boleta, factura o tarjeta)", pts: pr, max: 3, nota: leidaSII ? "declarada al SII" : resp === null ? "sin dato" : `${Math.round(resp)}%` },
      ...(TRAB ? [{ t: "Remuneraciones y cotizaciones al día", pts: prem, max: 2 }] : []),
      ...(!RS ? [] : CTA ? [
        { t: "Se traspasa la cuenta corriente", pts: 1, max: 1 },
        { t: "Línea de crédito aprobada", pts: d.lineaCredito === "si" ? 0.5 : 0, max: 0.5, nota: d.lineaCredito === "si" ? `cupo ${clp(n(d.lineaCupo))}, usado ${clp(lineaUsada)}` : d.lineaCredito === "no" ? "no tiene" : "sin dato" },
        { t: "Tarjeta de crédito de la empresa", pts: d.tarjetaCredito === "si" ? 0.5 : 0, max: 0.5, nota: d.tarjetaCredito === "si" ? `cupo ${clp(n(d.tarjetaCupo))}, usado ${clp(tarjetaUsada)}` : d.tarjetaCredito === "no" ? "no tiene" : "sin dato" },
      ] : [{ t: "Se traspasa la cuenta corriente", pts: 0, max: 2, nota: "no se incluye" }]),
    ], { deuda, hayDeuda: dFin > 0 || dLab > 0 || lineaUsada > 0 || tarjetaUsada > 0 || (RS && d.deudaFinanciera === "si") || (TRAB && d.deudaLaboral === "si"), respondida: Boolean(d.eerr), mejoras: m });
    if (lineaUsada + tarjetaUsada > 0) m.push(`Pagar lo usado de la línea y la tarjeta de crédito (${clp(lineaUsada + tarjetaUsada)}): se descuenta del precio.`);
  }

  // ---------- 9. Situación tributaria (10) ----------
  {
    const m: string[] = [];
    const pf = d.f29AlDia === "si" ? 3 : 0;
    const pb = (d.balance === "si" ? 2 : 0) + (d.preBalance === "si" ? 1 : 0);
    const pco = d.contador === "externo" || d.contador === "interno" ? 2 : 0;
    const pca = d.carpetaTributaria === "si" || d.carpetaToken ? 1 : 0;
    const ptg = d.certificadoTgr === "si" ? 1 : 0;
    if (!pf) m.push("Ponerse al día con las declaraciones mensuales (F29).");
    if (RS && d.balance !== "si") m.push("Pedir al contador el balance del último año.");
    if (RS && !pco) m.push("Contratar un contador: el comprador lo va a exigir.");
    // Sociedad limpia: se traspasa cambiando los estatutos, sin transferir patente, resolución ni contrato.
    const sinDeudas = [d.deudaArriendo, d.deudaEquipos, d.deudaPermisos, d.deudaFinanciera, d.deudaLaboral, d.deudaTributaria, d.deudaSistemas].every((x) => x === "no")
      && lineaUsada + tarjetaUsada === 0 && d.certificadoTgr === "si";
    if (RS && !sinDeudas) m.push("Dejar la sociedad sin deudas y con el certificado de la Tesorería limpio: así se vende cambiando los estatutos, sin transferir permisos ni contrato.");
    if (!ptg) m.push("Sacar el certificado de deuda de la Tesorería (tgr.cl).");
    crear("tributario", [
      { t: "Declaraciones mensuales (F29) al día", pts: pf, max: 3 },
      ...(RS ? [
        { t: "Balance del último año y pre-balance", pts: pb, max: 3, nota: [d.balance === "si" ? "balance" : "", d.preBalance === "si" ? "pre-balance" : ""].filter(Boolean).join(" y ") || "no" },
        { t: "Contador", pts: pco, max: 2, nota: { externo: "externo", interno: "interno", no: "no tiene", "": "sin dato" }[d.contador] },
      ] : []),
      { t: "Carpeta tributaria disponible", pts: pca, max: 1 },
      { t: "Certificado de deuda de la Tesorería sin deudas", pts: ptg, max: 1 },
      ...(RS ? [{ t: "Sociedad sin deudas: traspaso simple (solo cambio de estatutos)", pts: sinDeudas ? 3 : 0, max: 3, nota: sinDeudas ? "sin deudas declaradas" : "tiene deudas o faltan respuestas" }] : []),
    ], { deuda: deudaDe(d.deudaTributaria, d.deudaTributariaMonto), hayDeuda: d.deudaTributaria === "si", respondida: Boolean(d.f29AlDia || d.contador), mejoras: m });
  }

  // ---------- 10. Sistemas y procesos (7) ----------
  {
    const sel = d.sistemas.split(",").filter(Boolean);
    const items = SISTEMAS.map(([k, t, max]) => ({ t, pts: sel.includes(k) ? max : 0, max }));
    const m = SISTEMAS.filter(([k]) => !sel.includes(k)).slice(0, 2).map(([, t]) => `Implementar: ${t.split(" (")[0].toLowerCase()}.`);
    crear("sistemas", items, { deuda: deudaDe(d.deudaSistemas, d.deudaSistemasMonto), hayDeuda: d.deudaSistemas === "si", respondida: sel.length > 0 || d.deudaSistemas !== "", mejoras: m });
  }

  // ---------- 11. Redes sociales y marca (3) ----------
  {
    const seg = REDES ? n(d.instagram) + n(d.tiktok) + n(d.facebook) : 0;
    const ps = seg >= 20000 ? 1.5 : seg >= 5000 ? 1 : seg >= 1000 ? 0.5 : 0;
    const nota = Number(String(d.notaGoogle).replace(",", ".")) || 0;
    const res = n(d.resenasGoogle);
    const pg = !MARCA ? 0 : nota >= 4.5 && res >= 50 ? 1 : nota >= 4 && res >= 10 ? 0.5 : 0;
    const pi = MARCA && d.marcaInapi === "si" ? 0.5 : 0;
    const sinMarca = "la marca no se vende: el comprador parte con un nombre nuevo";
    crear("redes", [
      { t: "Seguidores en redes sociales", pts: ps, max: 1.5, nota: !MARCA ? sinMarca : !REDES ? "las cuentas de redes no se venden" : `${seg.toLocaleString("es-CL")} en total` },
      { t: "Nota en Google", pts: pg, max: 1, nota: !MARCA ? sinMarca : nota ? `${String(nota).replace(".", ",")} con ${res} reseñas` : "sin dato" },
      { t: "Marca registrada en INAPI", pts: pi, max: 0.5, nota: !MARCA ? sinMarca : undefined },
    ], { respondida: !MARCA || Boolean(seg || nota || d.marcaInapi), mejoras: !MARCA ? ["Incluir la marca y sus redes en la venta: el comprador no pierde a los clientes que reconocen el nombre."] : [...(!REDES ? ["Incluir las cuentas de redes sociales en la venta."] : []), ...(d.marcaInapi !== "si" ? ["Registrar la marca en INAPI: se vende junto con el negocio."] : [])] });
  }

  // ---------- Puntaje, factor y valor ----------
  // Puntaje sobre las preguntas que aplican según lo que se vende, llevado a base 100.
  const puntosObtenidos = dims.reduce((s, x) => s + x.puntos, 0);
  const puntosAplicables = dims.reduce((s, x) => s + x.max, 0);
  const puntajeSinTecho = r1(puntosAplicables ? (puntosObtenidos / puntosAplicables) * 100 : 0);
  const t = techo as { valor: number; motivo: string } | null;
  const puntaje = t ? Math.min(puntajeSinTecho, t.valor) : puntajeSinTecho;
  const factor = factorCalidad(puntaje);
  const tamano = neta * 1.19 < 50e6 ? "pequeño" : neta * 1.19 <= 100e6 ? "mediano" : "grande";
  const mm = multiploMercado(d.rubro, tamano);
  const base = UN * 12 * mm.multiplo;
  // Sin la marca, en comida y retail el comprador pierde parte de la clientela que reconoce el nombre: −10%.
  const ajustado = base * factor;
  const nivel = opt.verificado ?? null;
  const mesesRenovacion = d.renovacion === "si" && R > 0 ? TOPE_CONTRATO.mesesRenovacion : 0;
  const mesesContrato = R + mesesRenovacion;
  const pctTope = nivel ? TOPE_CONTRATO.verificado : TOPE_CONTRATO.declarado;
  const mesesTopeContrato = mesesContrato * pctTope;
  const topeContrato = UN * mesesTopeContrato;
  // Se aplica después del tope por contrato: menos clientela es menos utilidad en todo el plazo.
  const sinMarca = !MARCA && RUBROS_MARCA.includes(d.rubro);
  // Entorno: tienda ancla, temporada y competencia ajustan el valor directamente (tope de ±15%), SIEMPRE bajo el tope por contrato.
  const pctEntorno = Math.max(AJUSTES_ENTORNO.min, Math.min(AJUSTES_ENTORNO.max, efectoEntorno.reduce((s, x) => s + x.pct, 0)));
  const montoEntorno = ajustado * pctEntorno;
  const conEntorno = ajustado + montoEntorno;
  const baseTope = Math.min(conEntorno, topeContrato);
  const descuentoMarca = sinMarca ? baseTope * DESCUENTO_SIN_MARCA : 0;
  if (descuentoMarca) ajustes.push(`La marca no se vende: en ${d.rubro.toLowerCase()} el comprador pierde parte de la clientela que reconoce el nombre (−${Math.round(DESCUENTO_SIN_MARCA * 100)}%)`);
  if (d.estacionalidad === "alta") ajustes.push("Las ventas dependen de una temporada: la utilidad escrita debe ser el promedio de los 12 meses, no la de los meses buenos");
  const pctPrima = nivel ? PRIMA_VERIFICACION[nivel] : 0;
  const montoPrima = baseTope * pctPrima;
  // La prima por información verificada sí puede superar el tope: las cifras acreditadas bajan el riesgo del comprador.
  const conTope = baseTope + montoPrima - descuentoMarca;
  const operacional = Math.max(conTope, piso);
  const mercaderia = n(d.mercaderia);
  const vehiculos = valorVehiculos(d); // se suman a su valor depreciado, como la mercadería
  // Deudas: las nuevas por dimensión; si solo existen las antiguas (antes del 9 oct), se usan esas.
  const deudas = [
    { t: "Deuda con el arrendador", monto: deudaDe(d.deudaArriendo, d.deudaArriendoMonto) },
    { t: "Deuda por equipos", monto: deudaDe(d.deudaEquipos, d.deudaEquiposMonto) },
    { t: "Deuda por patentes y permisos", monto: deudaDe(d.deudaPermisos, d.deudaPermisosMonto) },
    { t: "Deuda de la empresa con bancos o proveedores", monto: RS ? deudaDe(d.deudaFinanciera, d.deudaFinancieraMonto) : 0 },
    { t: "Línea de crédito usada", monto: lineaUsada },
    { t: "Tarjeta de crédito usada", monto: tarjetaUsada },
    { t: "Deuda laboral y previsional", monto: TRAB ? deudaDe(d.deudaLaboral, d.deudaLaboralMonto) : 0 },
    { t: "Deuda tributaria", monto: deudaDe(d.deudaTributaria, d.deudaTributariaMonto) },
    { t: "Deuda por sistemas", monto: deudaDe(d.deudaSistemas, d.deudaSistemasMonto) },
  ].filter((x) => x.monto > 0);
  if (!deudas.length && d.deudas === "si" && n(d.deudasMonto)) deudas.push({ t: "Deudas laborales, tributarias o contables", monto: n(d.deudasMonto) });
  const totalDeudas = deudas.reduce((s, x) => s + x.monto, 0);
  const valorAntesDeudas = operacional + mercaderia + vehiculos;
  const valor = Math.max(0, valorAntesDeudas - totalDeudas);

  return {
    listo: U > 0 && neta > 0 && R > 0,
    listoInicial: U > 0 && neta > 0,
    dimensiones: dims, puntaje, puntajeSinTecho, techo: t, factor,
    utilidad: U, sueldoReemplazo: sueldo, utilidadNormalizada: UN, ventaNeta: neta, ventaAjustada: neta * 1.19, ajustes,
    tamano, multiplo: mm.multiplo, sectorMercado: mm.sector.nombre,
    base, ajustado, topeContrato, mesesTopeContrato, topeAplicado: conEntorno > topeContrato,
    mesesContrato, mesesRenovacion, pctTope, conEntorno, conTope,
    // (descuentoMarca se resta después del tope)
    piso, pisoAplicado: piso > conTope, operacional, mercaderia, vehiculos, deudas, totalDeudas, valorAntesDeudas, valor,
    estimacionInicial: UN * 12 * mm.multiplo,
    puntosObtenidos, puntosAplicables, descuentoMarca,
    entorno: { pct: pctEntorno, monto: montoEntorno, lineas: efectoEntorno },
    prima: { nivel, pct: pctPrima, monto: montoPrima }, saldoCaja: CTA ? n(d.saldoCuenta) : 0,
    sii: leidaSII || d.carpetaEstado === "revision" ? {
      estado: (d.carpetaEstado || "revision") as "leida" | "revision" | "verificada",
      ventaMensual: ventaSII, compraMensual: compraSII, declarada, diferencia, meses: mesesSII, ultimo: d.carpetaUltimo,
      ventasAnual: n(d.carpetaVentas12), comprasAnual: n(d.carpetaCompras12), ventasAnualAnterior: n(d.carpetaVentasAnt12) || null,
      coincide: leidaSII && (diferencia === null || Math.abs(diferencia) <= 0.1),
    } : null,
    alcance: { razonSocial: RS, cuenta: CTA, trabajadores: TRAB, marca: MARCA, redes: REDES, definido: Boolean(d.conRazonSocial && d.conMarca) },
    mesesRecupero: UN ? valor / UN : 0,
  };
}
