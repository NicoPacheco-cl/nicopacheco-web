// Datos ficticios para el «Ver ejemplo de certificado» de /valoriza (9–10 oct 2026).
// Cafetería inventada, con dos deudas, para que el ejemplo muestre todas las secciones del informe.
import { VALORIZACION_VACIA, type DatosValorizacion } from "./valorizacion";
import { PLANES_CERT, type PlanCert } from "./certificado";


export const DATOS_EJEMPLO: DatosValorizacion = {
  ...VALORIZACION_VACIA,
  conRazonSocial: "si", conCuenta: "si", conMarca: "si", conRedes: "si",
  lineaCredito: "si", lineaCupo: "5000000", lineaUsado: "1000000", tarjetaCredito: "si", tarjetaCupo: "2000000", tarjetaUsado: "300000", saldoCuenta: "1500000",
  rubro: "Cafetería", region: "Los Lagos", comuna: "Puerto Montt",
  ventaNeta: "12000000", ventaNetaAnterior: "10500000", utilidadMensual: "2500000",
  anosFuncionando: "6", trabajadores: "4", dependenciaDueno: "media", utilidadConSueldo: "no", sueldoReemplazo: "900000",
  arriendo: "900000", mesesRestantes: "48", gastoComun: "120000", m2: "38", renovacion: "si", autorizaCesion: "conversacion", contratoNotarial: "si",
  deudaArriendo: "si", deudaArriendoMonto: "1800000",
  inventarioNuevo: "30000000", anosUso: "3", mercaderia: "2000000", equiposFacturas: "si", mantenciones: "no", deudaEquipos: "no",
  peatonal: "alto", vehicular: "regular", competencia: "poca",
  entornoTipo: "strip", tiendaAncla: "si", tiendaAnclaNombre: "Unimarc", estacionalidad: "temporada",
  infraestructura: "bueno", estacionamientos: "0", stripCenter: "no",
  patente: "definitiva", mef: "no", sanitaria: "si", tipoResolucion: "cafeteria", mesas: "si",
  alcohol: "ninguna", vendeAlcohol: "no", deudaPermisos: "no",
  eerr: "parcial", flujoCaja: "si", conciliacion: "no", pctRespaldo: "80", remuneracionesAlDia: "si", ctaCorriente: "no",
  deudaFinanciera: "si", deudaFinancieraMonto: "2000000", deudaLaboral: "no",
  f29AlDia: "si", balance: "si", preBalance: "no", contador: "externo", carpetaTributaria: "si", certificadoTgr: "si", deudaTributaria: "no",
  sistemas: "pos,inventario", deudaSistemas: "no",
  instagram: "8000", tiktok: "0", facebook: "2000", notaGoogle: "4,6", resenasGoogle: "180", marcaInapi: "no",
};

export const CERTIFICADO_EJEMPLO = {
  id: "ejemplo0-0000-0000-0000-000000000000", folio: 1000, token: "ejemplo",
  creado_en: "2026-10-09T15:00:00.000Z", pagado_en: "2026-10-09T15:00:00.000Z",
  nombre: "Solicitante de ejemplo", correo: "", negocio: "Cafetería de ejemplo (datos ficticios)",
  datos: DATOS_EJEMPLO, valor: 0, precio_lista: 0, monto: 0, estado: "gratis",
};

// Ejemplo por plan: Gold y Platinum aparecen ya verificados (todos los documentos en orden).
export function certificadoEjemplo(plan: PlanCert = "standard") {
  if (plan === "standard") return { ...CERTIFICADO_EJEMPLO, plan };
  return {
    ...CERTIFICADO_EJEMPLO, plan, revision: "verificado" as const, revisado_en: "2026-10-10T15:00:00.000Z",
    datos: { ...DATOS_EJEMPLO, carpetaEstado: "verificada" as const, carpetaVentas12: "144000000", carpetaCompras12: "60000000", carpetaVentasAnt12: "126000000", carpetaMeses: "12", carpetaUltimo: "2026-09" },
    verificacion: { items: Object.fromEntries(PLANES_CERT[plan].docs.map((t) => [t, { ok: true }])) },
  };
}
