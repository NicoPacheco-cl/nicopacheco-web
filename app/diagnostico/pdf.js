import { calcular, clp, filasEstado, mesTexto, pct } from './calculo';

// PDF del estado de resultados, generado en el navegador: los datos no salen del equipo del visitante.
export async function crearPdf(estado) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const permitidos = new Set(normal.getCharacterSet());
  // Las fuentes estándar no admiten todos los caracteres; una cuenta con un emoji no debe romper la descarga.
  const limpio = (t) => [...String(t).replace(/−/g, '-')].map((x) => (permitidos.has(x.codePointAt(0)) ? x : '?')).join('');

  const NEGRO = rgb(13 / 255, 13 / 255, 13 / 255);
  const GRIS = rgb(92 / 255, 92 / 255, 92 / 255);
  const LINEA = rgb(222 / 255, 218 / 255, 210 / 255);
  const SUAVE = rgb(242 / 255, 239 / 255, 233 / 255);
  const ROJO = rgb(181 / 255, 70 / 255, 42 / 255);
  const BLANCO = rgb(1, 1, 1);
  const ANCHO = 595.28, ALTO = 841.89, MARGEN = 40, FONDO = 58;
  const X_MONTO = ANCHO - MARGEN - 66, X_PCT = ANCHO - MARGEN - 6;

  const c = calcular(estado);
  let hoja = pdf.addPage([ANCHO, ALTO]);
  let y = ALTO - 52;

  const texto = (t, x, yy, { f = normal, s = 9.5, color = NEGRO, derecha = false } = {}) => {
    const valor = limpio(t);
    hoja.drawText(valor, { x: derecha ? x - f.widthOfTextAtSize(valor, s) : x, y: yy, size: s, font: f, color });
  };
  const cortar = (t, f, s, ancho) => {
    const lineas = [];
    let actual = '';
    limpio(t).split(' ').forEach((palabra) => {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (f.widthOfTextAtSize(prueba, s) <= ancho || !actual) actual = prueba;
      else { lineas.push(actual); actual = palabra; }
    });
    if (actual) lineas.push(actual);
    return lineas;
  };

  texto('Diagnóstico financiero', MARGEN, y, { f: negrita, s: 20 });
  y -= 18;
  const datos = [estado.negocio.nombre, estado.negocio.rubro, mesTexto(estado.negocio.periodo)].filter(Boolean).join(' · ');
  if (datos) { texto(datos, MARGEN, y, { s: 10 }); y -= 14; }
  texto(`Montos ingresados ${estado.modoIva === 'con' ? 'con' : 'sin'} IVA. Porcentajes calculados sobre el total de ingresos.`, MARGEN, y, { s: 9.5, color: GRIS });
  y -= 26;
  [['Margen de contribución', pct(c.sobreVentas(c.margen)), c.margen], ['EBITDA', clp(c.ebitda), c.ebitda], ['Utilidad neta final', clp(c.neta), c.neta]].forEach(([rotulo, valor, n], i) => {
    const x = MARGEN + (i * (ANCHO - MARGEN * 2)) / 3;
    texto(rotulo, x, y, { s: 9, color: GRIS });
    texto(valor, x, y - 17, { f: negrita, s: 14, color: n < 0 ? ROJO : NEGRO });
  });
  y -= 38;

  const encabezado = () => {
    hoja.drawRectangle({ x: MARGEN, y: y - 6, width: ANCHO - MARGEN * 2, height: 19, color: NEGRO });
    texto('Cuenta', MARGEN + 6, y, { f: negrita, s: 9, color: BLANCO });
    texto('Monto', X_MONTO, y, { f: negrita, s: 9, color: BLANCO, derecha: true });
    texto('% ventas', X_PCT, y, { f: negrita, s: 9, color: BLANCO, derecha: true });
    y -= 21;
  };
  const nuevaHoja = () => { hoja = pdf.addPage([ANCHO, ALTO]); y = ALTO - 48; encabezado(); };
  encabezado();

  filasEstado(estado, c).forEach((f) => {
    const fuerte = f.tipo !== 'cuenta';
    const fuente = fuerte ? negrita : normal;
    const tamano = f.tipo === 'titulo' ? 10 : 9;
    const sangria = f.tipo === 'cuenta' ? 14 : 6;
    const lineas = cortar(f.etiqueta, fuente, tamano, X_MONTO - 80 - MARGEN - sangria);
    const alto = 15 + (lineas.length - 1) * 11 + (f.tipo === 'titulo' ? 8 : 0);
    if (y - alto < FONDO) nuevaHoja();
    if (f.tipo === 'titulo') y -= 8;
    if (f.tipo === 'resultado') hoja.drawRectangle({ x: MARGEN, y: y - 5, width: ANCHO - MARGEN * 2, height: 15 + (lineas.length - 1) * 11, color: SUAVE });
    if (f.tipo === 'total') hoja.drawLine({ start: { x: MARGEN, y: y + 10 }, end: { x: ANCHO - MARGEN, y: y + 10 }, thickness: 0.5, color: LINEA });
    lineas.forEach((l, i) => texto(l, MARGEN + sangria, y - i * 11, { f: fuente, s: tamano }));
    if (f.monto !== null && f.monto !== undefined) texto(clp(f.monto), X_MONTO, y, { f: fuente, s: tamano, derecha: true, color: f.monto < 0 ? ROJO : NEGRO });
    if (f.porcentaje) texto(f.porcentaje, X_PCT, y, { f: fuente, s: tamano, derecha: true, color: fuerte ? NEGRO : GRIS });
    y -= 15 + (lineas.length - 1) * 11;
  });

  const nota = `${estado.modoIva === 'con' ? 'El IVA pagado se descuenta antes de la utilidad neta.' : 'El IVA no resta de la utilidad.'} El PPM es un anticipo de renta. El impuesto a la renta es una estimación: confírmalo con tu contador.`;
  const hojas = pdf.getPages();
  hojas.forEach((h, i) => {
    hoja = h;
    cortar(nota, normal, 8, ANCHO - MARGEN * 2 - 70).forEach((l, n) => texto(l, MARGEN, 36 - n * 10, { s: 8, color: GRIS }));
    texto(`Página ${i + 1} de ${hojas.length}`, ANCHO - MARGEN, 36, { s: 8, color: GRIS, derecha: true });
    texto('nicopacheco.cl', ANCHO - MARGEN, 26, { s: 8, color: GRIS, derecha: true });
  });
  return pdf.save();
}

export function nombreArchivo(estado) {
  const nombre = (estado.negocio.nombre || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${['diagnostico-financiero', nombre, estado.negocio.periodo].filter(Boolean).join('-')}.pdf`;
}
