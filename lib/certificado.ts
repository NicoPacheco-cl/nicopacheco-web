// Certificado de valorización (v4, 9 oct 2026): precio y análisis que acompaña al valor de /valoriza.
// Módulo puro: lo usan el navegador (vista previa) y el servidor (PDF). El valor certificado es siempre el de
// valorizar(); los otros métodos son contraste y definen el rango de referencia.

import { clp, factorCalidad, fmtPts, pctTxt, PRIMA_VERIFICACION, valorizar, type DatosValorizacion, type Dimension, type NivelVerificado, type Resultado } from "./valorizacion";

// Tres certificados (13 oct 2026). Standard: solo lo declarado. Gold y Platinum: con documentos que Nico Pacheco
// revisa; si coinciden, el valor sube (prima por información verificada) y el certificado lleva sello holograma.
export type PlanCert = "standard" | NivelVerificado;
export type TipoDocCert = "ventas_sistema" | "carpeta" | "dicom" | "tgr" | "f30" | "arriendo" | "patente";
// 16 oct 2026 (decidido con Nico): Standard pierde fuerza a propósito («sin validación»), Gold es la recomendada
// y Platinum pasa a $500.000 de lista para que Gold se vea razonable; Platinum le dice al cliente que Gold basta.
export const PLANES_CERT: Record<PlanCert, {
  nombre: string; lista: number; estrellas: number; prima: number; mesesVigencia: number; docs: TipoDocCert[]; resumen: string; verifica: string; corto: string;
  etiqueta: string;       // frase corta bajo el nombre (tarjetas y PDF)
  ia: boolean;            // documentos leídos y contrastados con inteligencia artificial
  recomendado?: boolean;
  consejo?: string;       // mensaje que orienta la elección
}> = {
  standard: {
    nombre: "Standard", lista: 50_000, estrellas: 0, prima: 0, mesesVigencia: 3, docs: [], ia: false,
    etiqueta: "Valorización sin validación",
    resumen: "Valorización sin validación: el monto responde solo a la información que declaras, sin respaldo documental.",
    verifica: "Valorización sin validación: el monto responde solo a la información declarada por el vendedor, sin respaldo documental.",
    corto: "Valorización sin validación: solo información declarada, sin respaldo documental.",
    consejo: "Un comprador informado no paga por cifras que nadie revisó.",
  },
  gold: {
    nombre: "Gold", lista: 150_000, estrellas: 1, prima: PRIMA_VERIFICACION.gold, mesesVigencia: 6, docs: ["ventas_sistema", "carpeta"], ia: false, recomendado: true,
    etiqueta: "Validada con tus documentos",
    resumen: "Ventas verificadas con el SII y tu sistema de ventas; utilidad coherente con lo tributario. Revisamos tus documentos y los contrastamos con lo que declaras.",
    verifica: "Ventas verificadas con el sistema de ventas y la carpeta tributaria del SII; utilidad coherente con lo tributario (cabe dentro de las ventas menos las compras declaradas al SII y el arriendo). Documentos revisados y contrastados con lo declarado.",
    corto: "Validada con documentos: ventas verificadas con el SII; utilidad coherente con lo tributario.",
    consejo: "La que recomendamos: valida lo que más mueve el precio, las ventas, y basta para la gran mayoría de las ventas de negocios.",
  },
  platinum: {
    nombre: "Platinum", lista: 500_000, estrellas: 3, prima: PRIMA_VERIFICACION.platinum, mesesVigencia: 6, ia: false,
    docs: ["ventas_sistema", "carpeta", "dicom", "tgr", "f30", "arriendo", "patente"],
    etiqueta: "Validada con tus documentos · revisión completa",
    resumen: "Todo lo de Gold más deudas comerciales, tributarias, laborales y previsionales, contrato de arriendo y patente, revisados y contrastados con lo que declaras.",
    verifica: "Ventas verificadas con el SII; utilidad coherente con lo tributario; deudas (comerciales, tributarias, laborales y previsionales), contrato de arriendo y patente verificados con documentos. Documentos revisados y contrastados con lo declarado.",
    corto: "Validada con documentos: ventas, deudas, arriendo y patente verificados; utilidad coherente con lo tributario.",
    consejo: "Para operaciones grandes o compradores que exigen revisar deudas y contrato. Si solo necesitas demostrar tus ventas, la Gold es suficiente.",
  },
};
export const ORDEN_PLANES: PlanCert[] = ["standard", "gold", "platinum"];
export const esPlan = (x: unknown): x is PlanCert => x === "standard" || x === "gold" || x === "platinum";

export const DOCS_CERT: Record<TipoDocCert, { t: string; ayuda: string }> = {
  ventas_sistema: { t: "Certificado o reporte de ventas del sistema (12 meses)", ayuda: "Desde Bsale, Toteat, Fudo, Jumpseller u otro: ventas mes a mes de los últimos 12 meses, en PDF o imagen." },
  carpeta: { t: "Carpeta tributaria del SII (para solicitar créditos)", ayuda: "En sii.cl → Servicios online → Carpeta tributaria electrónica. Con los F29 se verifican ventas y compras." },
  dicom: { t: "Informe de deudas comerciales (Dicom)", ayuda: "Informe de Equifax de la empresa o del dueño, emitido hace menos de 30 días." },
  tgr: { t: "Certificado de deuda de la Tesorería", ayuda: "Gratis en tgr.cl con la Clave Única o del SII, emitido hace menos de 30 días." },
  f30: { t: "Certificado de antecedentes laborales y previsionales (F30)", ayuda: "En dt.gob.cl (Dirección del Trabajo), emitido hace menos de 30 días." },
  arriendo: { t: "Contrato de arriendo vigente", ayuda: "Con sus anexos y renovaciones, firmado por las partes." },
  patente: { t: "Patente municipal al día", ayuda: "Foto o PDF de la patente y del último pago." },
};

// Precio de lista del certificado Standard.
export const PRECIO_CERTIFICADO = PLANES_CERT.standard.lista;
// `descuento`: fracción de descuento sobre la lista (0 por defecto).
export const precioCertificado = (descuento: boolean | number, plan: PlanCert = "standard") =>
  Math.round(PLANES_CERT[plan].lista * (1 - (typeof descuento === "number" ? Math.max(0, Math.min(0.9, descuento)) : 0)));

// Supuestos del método de flujos descontados (definidos por Nico Pacheco; revisar con un especialista).
// 30% anual: costo de capital de Chile más primas por tamaño, iliquidez y dependencia del dueño de un negocio pequeño.
export const TASA_DESCUENTO = 0.3;
export const CRECIMIENTO_MAX = 0.2; // el crecimiento histórico se acota a ±20% anual para proyectar

const n = (v?: string) => Math.max(0, Number(String(v ?? "").replace(/\D/g, "")) || 0);
export const pct = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")}%`;
const veces = (x: number) => String(Math.round(x * 100) / 100).replace(".", ",");

export type Metodo = { id: string; nombre: string; valor: number; detalle: string };
export type Proyeccion = { ano: number; venta: number; utilidad: number };
export type AnalisisDimension = Dimension & {
  aporte: number;     // pesos que esta dimensión aporta hoy al valor (vía el factor de calidad)
  potencial: number;  // pesos que sumaría completarla (sin deuda y con todos sus puntos)
  lectura: string;    // conclusión del analista
};
export type Alcance = { t: string; v: string; nota: string }[];
export type Paso = { t: string; monto: number; nota?: string; total?: boolean };

export type Analisis = {
  r: Resultado;
  valor: number;              // valor certificado
  metodos: Metodo[];
  rango: [number, number];
  margen: number;             // utilidad normalizada / venta neta
  crecimiento: number | null; // histórico, anual (null si no se informó la venta de hace 12 meses)
  crecimientoProyectado: number;
  proyeccion: Proyeccion[];
  dimensiones: AnalisisDimension[];
  pasos: Paso[];              // cómo se llega del valor base al valor certificado
  nivel: string;              // lectura del puntaje
  venta: Alcance;             // qué incluye la venta y qué preguntas se consideraron
  fortalezas: string[];
  riesgos: string[];
};

export function nivelPuntaje(p: number) {
  if (p >= 85) return "Negocio muy bien documentado y de bajo riesgo para el comprador";
  if (p >= 70) return "Negocio en orden: el valor está en línea con el mercado";
  if (p >= 50) return "Negocio con riesgos o información por completar: el comprador pedirá descuento";
  if (p >= 30) return "Negocio con riesgos importantes: el valor se castiga bajo el mercado";
  return "Negocio con riesgos críticos: el valor se acerca al de sus equipos";
}

function lectura(dm: Dimension) {
  const p = dm.max ? dm.puntos / dm.max : 0;
  if (!dm.respondida) return "Sin información: se valoriza como riesgo, porque un comprador no paga por lo que no puede ver.";
  const deuda = dm.deuda > 0 ? ` La deuda de ${clp(dm.deuda)} resta ${fmtPts(dm.penalizacion)} puntos y además se descuenta completa del precio.` : "";
  if (p >= 0.85) return `Fortaleza: está sobre el estándar que pide un comprador informado.${deuda}`;
  if (p >= 0.6) return `Aceptable: cumple lo principal, con espacio para mejorar.${deuda}`;
  if (p >= 0.35) return `Débil: un comprador lo verá como riesgo y lo usará para negociar el precio a la baja.${deuda}`;
  return `Crítico: es el punto que más resta valor en esta dimensión.${deuda}`;
}

export function analizar(d: DatosValorizacion, opt: { verificado?: NivelVerificado | null } = {}): Analisis {
  const r = valorizar(d, opt);
  const U = r.utilidadNormalizada;
  const R = n(d.mesesRestantes);
  const neta = r.ventaNeta;
  const anterior = n(d.ventaNetaAnterior);

  const crecimiento = anterior > 0 && neta > 0 ? neta / anterior - 1 : null;
  const g = crecimiento === null ? 0 : Math.max(-CRECIMIENTO_MAX, Math.min(CRECIMIENTO_MAX, crecimiento));

  // Flujos descontados: utilidad normalizada durante los meses que quedan de contrato, creciendo al ritmo histórico
  // (acotado) y descontada al 30% anual. Es lo que el comprador puede esperar ganar con el contrato vigente.
  const gm = Math.pow(1 + g, 1 / 12) - 1;
  const km = Math.pow(1 + TASA_DESCUENTO, 1 / 12) - 1;
  let vp = 0;
  for (let t = 1; t <= R; t++) vp += (U * Math.pow(1 + gm, t)) / Math.pow(1 + km, t);

  const neto = (v: number) => Math.max(0, v + r.mercaderia + r.vehiculos - r.totalDeudas);
  const metodos: Metodo[] = [
    {
      id: "criterios", nombre: "Múltiplo ajustado por calidad (valor certificado)", valor: r.valor,
      detalle: `Utilidad anual normalizada de ${clp(U * 12)} × ${veces(r.multiplo)} veces (${r.sectorMercado}, ajustado a Chile y a un negocio ${r.tamano}) × factor de calidad ${veces(r.factor)} por ${fmtPts(r.puntaje)} de 100 puntos, con tope por contrato y piso por equipos.`,
    },
    {
      id: "ebitda", nombre: "Múltiplo de EBITDA de mercado", valor: neto(r.base),
      detalle: `Utilidad anual normalizada de ${clp(U * 12)} × ${veces(r.multiplo)} veces, sin ajustar por la calidad de la información ni por el contrato.`,
    },
    {
      id: "flujos", nombre: "Flujos descontados", valor: neto(vp),
      detalle: `Utilidad de los ${R} meses que quedan de contrato, con crecimiento de ${pct(g)} anual y tasa de descuento de ${pct(TASA_DESCUENTO)} anual.`,
    },
  ];
  const extras = [r.mercaderia > 0 ? `más mercadería por ${clp(r.mercaderia)}` : "", r.vehiculos > 0 ? `más vehículos por ${clp(r.vehiculos)}` : "", r.totalDeudas > 0 ? `menos deudas por ${clp(r.totalDeudas)}` : ""].filter(Boolean);
  if (extras.length) for (const m of metodos.slice(1)) m.detalle += ` ${extras.join(" y ").replace(/^./, (c) => c.toUpperCase())}.`;
  const valores = metodos.map((m) => m.valor);

  const anos = Math.max(1, Math.min(5, Math.ceil(R / 12)));
  const proyeccion: Proyeccion[] = Array.from({ length: anos }, (_, i) => ({
    ano: i + 1,
    venta: neta * 12 * Math.pow(1 + g, i + 1),
    utilidad: U * 12 * Math.pow(1 + g, i + 1),
  }));

  // Cuánto aporta cada dimensión: diferencia del factor de calidad con y sin sus puntos, sobre el valor base.
  const P = r.puntajeSinTecho;
  const escala = r.puntosAplicables ? 100 / r.puntosAplicables : 1; // puntos de la dimensión → puntos sobre 100
  const dimensiones: AnalisisDimension[] = r.dimensiones.map((dm) => ({
    ...dm,
    aporte: Math.max(0, r.base * (factorCalidad(P) - factorCalidad(P - dm.puntos * escala))),
    potencial: Math.max(0, r.base * (factorCalidad(P + (dm.max - dm.puntos) * escala) - factorCalidad(P))),
    lectura: lectura(dm),
  }));

  const pasos: Paso[] = [
    { t: "Utilidad mensual declarada (EBITDA)", monto: r.utilidad },
  ];
  if (r.sueldoReemplazo > 0) pasos.push({ t: "Menos sueldo de reemplazo del dueño", monto: -r.sueldoReemplazo, nota: "La utilidad no incluía un sueldo para quien administra: el comprador tendrá que pagarlo o trabajar él." });
  pasos.push(
    { t: "Utilidad mensual normalizada", monto: U, total: true },
    { t: `Valor base: × 12 meses × ${veces(r.multiplo)} veces`, monto: r.base, nota: `Múltiplo EV/EBITDA del sector en Latinoamérica, ajustado al riesgo de Chile y al tamaño (${r.tamano}).` },
    { t: `Ajuste por calidad: × ${veces(r.factor)} (${fmtPts(r.puntaje)} puntos)`, monto: r.ajustado - r.base, nota: "Con 70 puntos el factor es 1: el negocio vale lo que dice el mercado. Por debajo se castiga, por encima se premia hasta 1,2." },
  );
  if (r.entorno.monto !== 0) pasos.push({ t: `Ajuste por entorno (${pctTxt(r.entorno.pct)})`, monto: r.entorno.monto, nota: r.entorno.lineas.map((x) => `${x.t} (${pctTxt(x.pct)})`).join(". ") + "." });
  if (r.topeAplicado) pasos.push({ t: `Tope por contrato (${fmtPts(r.mesesTopeContrato)} meses de utilidad)`, monto: r.topeContrato - r.conEntorno, nota: `El comprador debe recuperar su inversión antes de ${r.pctTope === 0.5 ? "la mitad" : "el 40%"} del contrato que le queda (${r.mesesContrato} meses${r.mesesRenovacion ? `, con ${r.mesesRenovacion} de renovación por escrito` : ""}); el resto es su ganancia. ${r.pctTope === 0.5 ? "Con documentos verificados el tope es 50%." : "Sin documentos que acrediten las cifras el tope es 40%; con la valorización Gold o Platinum verificada sube a 50%."}` });
  if (r.prima.monto > 0 && r.prima.nivel) pasos.push({ t: `Prima por información verificada (${PLANES_CERT[r.prima.nivel].nombre}, ${pctTxt(r.prima.pct)})`, monto: r.prima.monto, nota: `${PLANES_CERT[r.prima.nivel].verifica} Las mismas cifras respaldadas por documentos valen más: el comprador se ahorra validarlas y corre menos riesgo.` });
  if (r.descuentoMarca > 0) pasos.push({ t: "Menos 10% porque la marca no se vende", monto: -r.descuentoMarca, nota: "En comida y retail, buena parte de la clientela vuelve por el nombre. Sin la marca, el comprador parte de nuevo con esa clientela." });
  if (r.pisoAplicado) pasos.push({ t: "Piso por valor de los equipos", monto: r.piso - r.conTope, nota: "El negocio vale al menos lo que costaría comprar sus equipos usados." });
  if (r.mercaderia > 0) pasos.push({ t: "Más mercadería en bodega", monto: r.mercaderia });
  if (r.vehiculos > 0) pasos.push({ t: "Más vehículos incluidos (valor depreciado)", monto: r.vehiculos, nota: "Precio nuevo menos 8% por año de uso, con un mínimo de 20% a los 10 años. Si tienen crédito o prenda, se descuenta como deuda por equipos." });
  for (const x of r.deudas) pasos.push({ t: `Menos ${x.t.charAt(0).toLowerCase()}${x.t.slice(1)}`, monto: -x.monto });
  pasos.push({ t: "Valor de referencia certificado", monto: r.valor, total: true });
  if (r.saldoCaja > 0) {
    pasos.push({ t: "Más saldo en la cuenta corriente, si se traspasa al cierre", monto: r.saldoCaja, nota: "No es parte del valor del negocio: es dinero de la empresa. Se suma peso por peso solo si queda en la cuenta el día de la venta; lo normal es que el vendedor lo retire o se ajuste al cerrar." });
    pasos.push({ t: "Precio con el saldo de la cuenta", monto: r.valor + r.saldoCaja, total: true });
  }

  const ord = [...dimensiones].sort((a, b) => b.puntos / b.max - a.puntos / a.max);
  const fortalezas = ord.filter((x) => x.respondida && x.puntos / x.max >= 0.8).slice(0, 3).map((x) => `${x.titulo}: ${fmtPts(x.puntos)} de ${x.max} puntos.`);
  if (r.sii?.coincide) fortalezas.unshift(`Ventas verificadas con los F29 declarados al SII (${r.sii.meses} meses).`);
  for (const x of r.entorno.lineas.filter((y) => y.pct >= 0.05)) fortalezas.unshift(`${x.t} (${pctTxt(x.pct)} al valor).`);
  if (r.prima.nivel) fortalezas.unshift(`Valorización ${PLANES_CERT[r.prima.nivel].nombre}: ${PLANES_CERT[r.prima.nivel].verifica.charAt(0).toLowerCase()}${PLANES_CERT[r.prima.nivel].verifica.slice(1)}`);
  const riesgos = [
    ...(r.techo ? [`Puntaje limitado a ${r.techo.valor}: ${r.techo.motivo}.`] : []),
    ...[...dimensiones].sort((a, b) => b.potencial - a.potencial).filter((x) => x.potencial > 0 && x.puntos / x.max < 0.6).slice(0, 3)
      .map((x) => `${x.titulo}: ${fmtPts(x.puntos)} de ${x.max} puntos; completarla podría sumar hasta ${clp(x.potencial)}.`),
    ...r.entorno.lineas.filter((x) => x.pct < 0).map((x) => `${x.t} (${pctTxt(x.pct)} al valor).`),
    ...(r.totalDeudas > 0 ? [`Deudas declaradas por ${clp(r.totalDeudas)}, que se descuentan del precio.`] : []),
  ];

  return {
    r, valor: r.valor, metodos, rango: [Math.min(...valores), Math.max(...valores)],
    margen: neta ? U / neta : 0, crecimiento, crecimientoProyectado: g, proyeccion,
    dimensiones, pasos, nivel: nivelPuntaje(r.puntaje), fortalezas, riesgos, venta: alcanceVenta(d, r),
  };
}

export const ALCANCE =
  "Valor de referencia del derecho de llave. Parte de la utilidad normalizada del negocio multiplicada por el múltiplo EV/EBITDA de su sector, y la ajusta por un puntaje de calidad de 100 puntos en 11 dimensiones: el negocio, el contrato de arriendo, equipos, ubicación, entorno, el local, patentes y permisos, estado financiero, situación tributaria, sistemas y procesos, y redes sociales. El entorno (tienda ancla, temporada de ventas y competencia a 500 metros) ajusta además el valor directamente. Se contrasta con el múltiplo de mercado sin ajustar y con flujos descontados, y se descuentan todas las deudas declaradas.";

export const METODOLOGIA = [
  "Un comprador paga por la utilidad futura que puede asegurar. Por eso el punto de partida es la utilidad mensual normalizada: la declarada, menos el sueldo de quien tendría que reemplazar al dueño si la utilidad no lo incluye.",
  "Esa utilidad anual se multiplica por lo que el mercado paga por empresas del mismo sector (EV/EBITDA de Latinoamérica, Kroll 2025), ajustado al riesgo de Chile (Damodaran 2026) y con un descuento por tamaño, porque un negocio pequeño es menos líquido y más riesgoso que una empresa listada. El resultado queda entre 2,5 y 5 veces la utilidad anual.",
  "El puntaje de 100 puntos mide qué tan transferible, comprobable y seguro es ese negocio. No suma pesos directamente: mueve el múltiplo. Con 70 puntos el negocio vale lo que dice el mercado; con 100 puede valer 20% más; con 30, 25% menos, y con 0, 40% menos.",
  "Los pesos de cada dimensión siguen el riesgo que representan para el comprador: lo que puede cerrar el negocio o no se puede reemplazar (arriendo, permisos, utilidad comprobable) pesa más que lo que se compra o se reconstruye (equipos, local, redes).",
  "El entorno suma puntos y además mueve el valor directamente, entre −14% y +13%: una tienda ancla en el mismo centro comercial suma 8% (5% si está a menos de 100 metros) porque trae público propio todos los días; las ventas parejas todo el año suman 3% y las que dependen de una temporada restan 10%, por los meses flojos con los mismos costos fijos; no tener competidores directos a 500 metros suma 2% y tener 3 o más resta 4%. Sin tienda ancla no hay ajuste.",
  "Información verificada: las certificaciones Gold y Platinum suman 5% y 10% al valor cuando Nico Pacheco revisa los documentos y coinciden con lo declarado. Las ventas se verifican con los F29 declarados al SII; la utilidad no se puede verificar mes a mes porque el SII no la informa, por eso se exige que sea coherente con lo tributario: que quepa dentro de las ventas menos las compras declaradas y el arriendo. Si un documento muestra otra cifra, se usa la del documento. Con las mismas cifras, un negocio respaldado por documentos oficiales vale más, porque el comprador se ahorra validarlas y corre menos riesgo; Platinum vale el doble porque descarta además las deudas ocultas por las que el comprador podría responder (impuestos y trabajadores).",
  "Las deudas castigan dos veces: restan puntos en su dimensión, porque muestran un problema de gestión, y su monto se descuenta completo del precio, porque alguien tendrá que pagarlas.",
];

export const AVISO_LEGAL = [
  "Este certificado entrega un valor de referencia. No es una tasación pericial, una auditoría ni una oferta de compra o venta, y no obliga a Nico Pacheco, al solicitante ni a terceros.",
  "Todo valor de un negocio se ajusta a criterios de contexto generales y puede cambiar en el tiempo. El análisis puede no considerar elementos particulares, específicos o atípicos de cada caso que podrían ser relevantes para el valor final.",
  "El cálculo se basa exclusivamente en la información declarada por el solicitante, que Nico Pacheco no ha verificado. Si los datos son incorrectos o incompletos, el valor también lo será.",
  "El precio final lo acuerdan libremente comprador y vendedor. Antes de comprar o vender, recomendamos revisar los documentos del negocio con un abogado y un contador.",
];

// Qué incluye la venta: define qué preguntas aplican (no se valoriza lo que el comprador no se lleva).
export function alcanceVenta(d: DatosValorizacion, r: Resultado): Alcance {
  const a = r.alcance;
  const sinResp = (v: string) => (v ? "" : " (sin respuesta: se asume)");
  const out: Alcance = [
    a.razonSocial
      ? { t: "Razón social (la empresa)", v: "Se vende", nota: "El comprador sigue con la patente, la resolución sanitaria y el contrato a nombre de la empresa: solo cambian los estatutos. Por eso se evalúan sus deudas, balances, contador y cuenta corriente, y una sociedad sin deudas suma puntos." }
      : { t: "Razón social (la empresa)", v: `No se vende${sinResp(d.conRazonSocial)}`, nota: "Las deudas de la empresa con bancos y proveedores, sus balances y su cuenta corriente quedan con el vendedor y no se valorizan. Igual se revisan los impuestos: quien compra un establecimiento queda como fiador de los impuestos del vendedor (Código Tributario, art. 71)." },
  ];
  if (a.razonSocial) out.push(a.cuenta
    ? { t: "Cuenta corriente", v: "Se traspasa", nota: "La línea y la tarjeta aprobadas suman puntos; lo usado es deuda y se descuenta. El saldo a favor se muestra aparte." }
    : { t: "Cuenta corriente", v: "No se traspasa", nota: "El comprador deberá abrir una cuenta nueva y conseguir crédito por su cuenta." });
  else out.push(a.trabajadores
    ? { t: "Trabajadores", v: "Siguen con el comprador", nota: "Hereda su antigüedad e indemnizaciones (Código del Trabajo, art. 4): se evalúan las remuneraciones y las deudas laborales." }
    : { t: "Trabajadores", v: `El vendedor los finiquita${sinResp(d.trabajadoresPasan)}`, nota: "No se consideran deudas laborales; el comprador contrata a su propio equipo." });
  out.push(a.marca
    ? { t: "Marca y nombre comercial", v: a.redes ? "Se venden, con las redes sociales" : "Se venden, sin las redes sociales", nota: a.redes ? "La reputación digital pasa al comprador." : "Los seguidores no suman puntos." }
    : { t: "Marca y nombre comercial", v: "No se venden", nota: `La etapa de redes y marca queda en 0 puntos${r.descuentoMarca ? " y el valor baja 10%, porque en este rubro la clientela vuelve por el nombre" : ""}.` });
  out.push({ t: "Puntaje", v: `${fmtPts(r.puntosObtenidos)} de ${fmtPts(r.puntosAplicables)} puntos que aplican`, nota: `Se lleva a base 100: ${fmtPts(r.puntaje)} puntos.` });
  return out;
}
