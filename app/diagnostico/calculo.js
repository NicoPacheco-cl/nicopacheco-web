// Diagnóstico financiero gratis: dimensiones del estado de resultados y su cálculo.
// Cada cuenta por defecto es [nombre, monto del ejemplo].
export const IVA_TASA = 0.19;

export const DIMENSIONES = [
  { id: 'ingresos', nombre: 'Ingresos', pregunta: '¿Cuánto vendió tu negocio este mes y por qué canales?', total: 'Total ingresos', agregar: 'Agregar línea de ingreso',
    cuentas: [['Línea de ingreso 1', 0], ['Línea de ingreso 2', 0], ['Línea de ingreso 3', 0]],
    ejemplo: [['Venta en local', 17600000], ['Delivery y apps', 6200000], ['Catering', 1800000]] },
  { id: 'directos', nombre: 'Costos directos de venta', pregunta: '¿Cuánto te costó directamente producir y entregar lo que vendiste?', total: 'Total directo de venta',
    cuentas: [['Insumos (alimentos, materiales, elementos de fabricación)', 6880000], ['Packaging', 540000], ['Comisión operadores logística', 980000], ['Comisión POS venta', 390000], ['Otros costos directos de venta', 120000]] },
  { id: 'rrhh', nombre: 'Payroll / RRHH', pregunta: '¿Cuánto pagaste por tu equipo este mes?', total: 'Total costos de RRHH',
    cuentas: [['Nómina laboral', 4100000], ['Cotizaciones previsionales', 780000], ['Personal en entrenamiento', 150000], ['Finiquitos', 0], ['Viáticos y colaciones', 210000], ['Ropa corporativa', 60000], ['Otros gastos de recursos humanos', 50000]] },
  { id: 'renta', nombre: 'Real estate / Renta', pregunta: '¿Cuánto pagas por el lugar donde opera tu negocio?', total: 'Total costos de renta',
    cuentas: [['Renta mensual', 1900000], ['Otros gastos de renta', 180000]] },
  { id: 'fijos', nombre: 'Gastos fijos', pregunta: '¿Cuánto pagaste en consumos básicos de la operación?', total: 'Total gastos fijos',
    cuentas: [['Electricidad', 420000], ['Gas', 290000], ['Combustible', 60000], ['Agua', 95000], ['Otros gastos fijos', 30000]] },
  { id: 'marketing', nombre: 'Marketing', pregunta: '¿Cuánto invertiste en dar a conocer tu negocio?', total: 'Total costos de marketing',
    cuentas: [['Servicios gráficos', 80000], ['Meta Ads', 250000], ['Google Ads', 120000], ['Merchandising', 0], ['Servicios musicales', 25000], ['Servicios de publicidad', 0], ['Community manager', 280000], ['Otros gastos de marketing', 0]] },
  { id: 'admin', nombre: 'Administración', pregunta: '¿Cuánto cuesta mantener el negocio en orden y al día?', total: 'Total costos de administración',
    cuentas: [['Insumos de oficina', 45000], ['Servicios contables', 150000], ['Patentes y permisos', 85000], ['Gastos legales y notariales', 0], ['Membresía ERP', 60000], ['Membresía sistema de venta', 45000], ['Asesoría financiera', 120000], ['Mantención e intereses bancarios', 55000], ['Web, certificaciones y membresías digitales', 18000], ['Asesoría prevención de riesgo', 60000], ['Otros gastos administrativos', 0]] },
  { id: 'higiene', nombre: 'Higiene e inocuidad', pregunta: '¿Cuánto gastaste en limpieza e inocuidad?', total: 'Total gastos de higiene e inocuidad',
    cuentas: [['Insumos de higiene', 130000], ['Otros gastos de higiene', 20000]] },
  { id: 'comunicacion', nombre: 'Comunicación', pregunta: '¿Cuánto pagas por conexión, telefonía y seguridad?', total: 'Total costos de servicios de comunicación',
    cuentas: [['Internet', 39000], ['Planes telefónicos', 42000], ['Cámara, alarma y seguridad', 35000], ['Otros gastos de comunicaciones', 0]] },
  { id: 'logistica', nombre: 'Logística', pregunta: '¿Cuánto te cuesta mover productos y vehículos?', total: 'Total costos de logística',
    cuentas: [['Estacionamiento (boleta)', 12000], ['Combustible auto', 40000], ['Combustible camioneta', 85000], ['Lavado de auto', 8000], ['Fletes', 60000], ['Otros gastos de logística', 0]] },
  { id: 'inversiones', nombre: 'Inversiones', pregunta: '¿Cuánto destinaste este mes a mejorar o mantener el local y sus equipos?', total: 'Total gastos de inversión',
    cuentas: [['Decoración', 0], ['Equipamiento', 180000], ['Infraestructura y mantención del local', 120000], ['Otros gastos de inversiones', 0]] },
  { id: 'creditos', nombre: 'Créditos', pregunta: '¿Cuánto pagaste este mes por tus créditos?', total: 'Total gastos de créditos',
    cuentas: [['Crédito 1', 320000], ['Crédito 2', 190000], ['Crédito 3', 0], ['Otros gastos crediticios', 0]] },
];

export const OPERACION = ['rrhh', 'renta', 'fijos', 'marketing', 'admin', 'higiene', 'comunicacion', 'logistica', 'inversiones'];
export const ORDEN = [...DIMENSIONES.map((d) => d.id), 'impuestos', 'resultado'];
export const DIMENSION = Object.fromEntries(DIMENSIONES.map((d) => [d.id, d]));

export function estadoInicial(conEjemplo = false) {
  let siguienteId = 1;
  const cuentas = {};
  DIMENSIONES.forEach((d) => {
    const base = conEjemplo && d.ejemplo ? d.ejemplo : d.cuentas;
    cuentas[d.id] = base.map(([nombre, monto]) => ({ id: siguienteId++, nombre, monto: conEjemplo ? monto : 0 }));
  });
  return {
    ejemplo: conEjemplo,
    siguienteId,
    cuentas,
    negocio: conEjemplo
      ? { nombre: 'Cafetería de ejemplo', rubro: 'Gastronomía', periodo: '2026-10' }
      : { nombre: '', rubro: '', periodo: '' },
    ventasAnterior: conEjemplo ? 24200000 : 0,
    iva: conEjemplo ? 2300000 : 0,
    ppm: conEjemplo ? 107000 : 0,
    modoIva: 'con',
    tasaRenta: 12.5,
  };
}

// Cálculo puro. Todos los montos son mensuales, en pesos chilenos.
export function calcular(e) {
  const totales = {};
  DIMENSIONES.forEach((d) => {
    totales[d.id] = e.cuentas[d.id].reduce((suma, c) => suma + (Number(c.monto) || 0), 0);
  });
  const ingresos = totales.ingresos;
  const anterior = Number(e.ventasAnterior) || 0;
  const crecimiento = anterior > 0 ? (ingresos - anterior) / anterior : null;
  const margen = ingresos - totales.directos;
  const operacion = OPERACION.reduce((suma, id) => suma + totales[id], 0);
  const ebitda = margen - operacion;
  const antesImpuestos = ebitda - totales.creditos;
  const iva = Number(e.iva) || 0;
  const ppm = Number(e.ppm) || 0;
  const ivaResta = e.modoIva === 'con' ? iva : 0;
  const baseRenta = antesImpuestos - ivaResta;
  const renta = Math.round((Math.max(0, baseRenta) * (Number(e.tasaRenta) || 0)) / 100);
  const neta = baseRenta - renta;
  const baseIva = Math.max(0, margen);
  const ivaReferencia = Math.round(e.modoIva === 'con' ? (baseIva * IVA_TASA) / (1 + IVA_TASA) : baseIva * IVA_TASA);
  return {
    ingresos, crecimiento, totales, margen, operacion, ebitda, antesImpuestos, iva, ppm, ivaResta,
    totalMensual: iva + ppm, renta, impuestos: renta + ivaResta, neta, ivaReferencia,
    operacionSobreMargen: margen > 0 ? operacion / margen : null,
    sobreVentas: (n) => (ingresos > 0 ? n / ingresos : null),
  };
}

export const clp = (n) => `${n < 0 ? '−' : ''}$${Math.abs(Math.round(n)).toLocaleString('es-CL')}`;
export const pct = (r) =>
  r === null || !Number.isFinite(r)
    ? '—'
    : `${(r * 100).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
export const tasaTexto = (t) => String(t).replace('.', ',');

export function mesTexto(periodo) {
  const m = /^(\d{4})-(\d{2})$/.exec(periodo || '');
  if (!m) return '';
  return new Date(+m[1], +m[2] - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}

// Filas del estado de resultados completo, usadas en pantalla, en Excel y en el PDF.
export function filasEstado(e, c = calcular(e)) {
  const filas = [];
  const p = (n) => pct(c.sobreVentas(n));
  const fila = (tipo, etiqueta, monto, porcentaje) => filas.push({ tipo, etiqueta, monto, porcentaje });
  const bloque = (d) => {
    fila('titulo', d.nombre);
    e.cuentas[d.id].forEach((a) => fila('cuenta', a.nombre, Number(a.monto) || 0, p(Number(a.monto) || 0)));
    fila('total', d.total, c.totales[d.id], p(c.totales[d.id]));
  };
  bloque(DIMENSION.ingresos);
  fila('cuenta', '% crecimiento de venta', null, pct(c.crecimiento));
  bloque(DIMENSION.directos);
  fila('resultado', 'Margen de contribución (margen bruto)', c.margen, p(c.margen));
  OPERACION.forEach((id) => bloque(DIMENSION[id]));
  fila('titulo', 'Costos de operación');
  fila('total', 'Total costos de operación', c.operacion, p(c.operacion));
  fila('cuenta', '% sobre margen de contribución', null, pct(c.operacionSobreMargen));
  fila('resultado', 'EBITDA', c.ebitda, p(c.ebitda));
  bloque(DIMENSION.creditos);
  fila('resultado', 'Utilidad antes de impuestos', c.antesImpuestos, p(c.antesImpuestos));
  fila('titulo', 'Impuestos mensuales');
  fila('cuenta', e.modoIva === 'con' ? 'IVA del SII (se resta de la utilidad)' : 'IVA del SII (no resta de la utilidad)', c.iva, p(c.iva));
  fila('cuenta', 'PPM (anticipo de renta)', c.ppm, p(c.ppm));
  fila('total', 'Total a pagar', c.totalMensual, p(c.totalMensual));
  fila('titulo', 'Impuesto a la renta / utilidades');
  fila('total', `Total a pagar (tasa ${tasaTexto(e.tasaRenta)}%)`, c.renta, p(c.renta));
  fila('resultado', 'Utilidad neta final', c.neta, p(c.neta));
  return filas;
}
