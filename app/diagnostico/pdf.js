import { barrasResumen, calcular, clp, filasEstado, filasProforma, mesTexto, pct, pesos100 } from './calculo';

// PDF del estado de resultados, generado en el navegador: los datos no salen del equipo del visitante.
export async function crearPdf(estado) {
  const { PDFDocument, StandardFonts, degrees, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const permitidos = new Set(normal.getCharacterSet());
  // Las fuentes estándar no admiten todos los caracteres; una cuenta con un emoji no debe romper la descarga.
  const limpio = (t) => [...String(t).replace(/−/g, '-')].map((x) => (permitidos.has(x.codePointAt(0)) ? x : '?')).join('');

  const color = (hex) => rgb(parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255);
  const NEGRO = color('10282d');
  const BANDA = color('103f47');
  const GRIS = color('546a6e');
  const LINEA = color('cfdbdb');
  const SUAVE = color('e2eaea');
  const ROJO = color('b3261e');
  const VERDE = color('17694a');
  const NARANJA = color('a8541a');
  const BARRA = color('5c9aa2');
  const BLANCO = rgb(1, 1, 1);
  const ANCHO = 595.28, ALTO = 841.89, MARGEN = 40, FONDO = 76;
  const X_MONTO = ANCHO - MARGEN - 66, X_PCT = ANCHO - MARGEN - 6;

  const c = calcular(estado);
  const imagen = async (ruta) => {
    try {
      const r = await fetch(ruta);
      if (!r.ok) return null;
      return await pdf.embedPng(await r.arrayBuffer());
    } catch {
      return null;
    }
  };
  // Si una imagen no carga, el PDF se entrega igual con la marca escrita.
  const [logo, sello] = await Promise.all([imagen('/marca/nico-pacheco.png'), imagen('/marca/sello-nicopacheco.png')]);
  let hoja;
  let y;

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

  const marca = (x, yy, alto) => {
    if (logo) hoja.drawImage(logo, { x, y: yy, width: (logo.width / logo.height) * alto, height: alto });
    else texto('NICO PACHECO', x, yy + 1, { f: negrita, s: alto * 0.8 });
  };
  // El sello va primero para quedar detrás de los números.
  const dibujarSello = () => {
    const angulo = 38;
    const rad = (angulo * Math.PI) / 180;
    if (sello) {
      const w = 600;
      const h = (sello.height / sello.width) * w;
      hoja.drawImage(sello, {
        x: ANCHO / 2 - (w / 2) * Math.cos(rad) + (h / 2) * Math.sin(rad),
        y: ALTO / 2 - (w / 2) * Math.sin(rad) - (h / 2) * Math.cos(rad),
        width: w, height: h, rotate: degrees(angulo), opacity: 0.07,
      });
    } else {
      const s = 62;
      const w = negrita.widthOfTextAtSize('NICOPACHECO.CL', s);
      hoja.drawText('NICOPACHECO.CL', {
        x: ANCHO / 2 - (w / 2) * Math.cos(rad), y: ALTO / 2 - (w / 2) * Math.sin(rad),
        size: s, font: negrita, color: NEGRO, rotate: degrees(angulo), opacity: 0.07,
      });
    }
  };
  const abrirHoja = () => {
    hoja = pdf.addPage([ANCHO, ALTO]);
    dibujarSello();
    marca(MARGEN, ALTO - 42, 18);
    texto('www.nicopacheco.cl', ANCHO - MARGEN, ALTO - 37, { s: 9, color: GRIS, derecha: true });
    hoja.drawLine({ start: { x: MARGEN, y: ALTO - 50 }, end: { x: ANCHO - MARGEN, y: ALTO - 50 }, thickness: 0.75, color: LINEA });
    y = ALTO - 76;
  };

  abrirHoja();
  texto('Diagnóstico Pyme', MARGEN, y, { f: negrita, s: 20 });
  y -= 18;
  const datos = [estado.negocio.nombre, estado.negocio.rubro, mesTexto(estado.negocio.periodo)].filter(Boolean).join(' · ');
  if (datos) { texto(datos, MARGEN, y, { s: 10 }); y -= 14; }
  texto(`Montos ingresados ${estado.modoIva === 'con' ? 'con' : 'sin'} IVA. Porcentajes calculados sobre el total de ingresos.`, MARGEN, y, { s: 9.5, color: GRIS });
  y -= 26;
  [['Margen de contribución', pct(c.sobreVentas(c.margen)), c.margen], ['EBITDA', clp(c.ebitda), c.ebitda], ['Utilidad neta final', clp(c.neta), c.neta]].forEach(([rotulo, valor, n], i) => {
    const x = MARGEN + (i * (ANCHO - MARGEN * 2)) / 3;
    texto(rotulo, x, y, { s: 9, color: GRIS });
    const tono = n < 0 ? ROJO : NEGRO;
    texto(valor, x, y - 17, { f: negrita, s: 14, color: tono });
    if (i === 1) texto(`(${pct(c.sobreVentas(c.ebitda))})`, x + negrita.widthOfTextAtSize(limpio(valor), 14) + 4, y - 17, { f: negrita, s: 10, color: tono });
  });
  y -= 44;

  // Resumen: gráfico y proforma financiera, en la primera hoja.
  texto('De cada $100 que vendes', MARGEN, y, { f: negrita, s: 11 });
  y -= 16;
  const X_PISTA = MARGEN + 118, X_VALOR = ANCHO - MARGEN, ANCHO_PISTA = X_VALOR - 44 - X_PISTA;
  barrasResumen(c).forEach((b) => {
    texto(b.etiqueta, MARGEN, y, { s: 8.5 });
    hoja.drawRectangle({ x: X_PISTA, y: y - 1, width: ANCHO_PISTA, height: 7.5, color: SUAVE });
    const relleno = b.clase === 'buena' ? VERDE : b.clase === 'mala' ? ROJO : BARRA;
    if (b.ancho > 0) hoja.drawRectangle({ x: X_PISTA, y: y - 1, width: ANCHO_PISTA * b.ancho, height: 7.5, color: relleno });
    texto(pesos100(b.valor), X_VALOR, y, { f: negrita, s: 8.5, derecha: true, color: b.valor < 0 ? ROJO : NEGRO });
    y -= 13;
  });
  y -= 12;

  const filasPf = filasProforma(estado, c);
  const ALTO_PF = 15, TOPE_PF = y, X_ETQ = X_MONTO - 86;
  hoja.drawRectangle({ x: MARGEN, y: y - 6, width: ANCHO - MARGEN * 2, height: 20, color: BANDA });
  texto('Proforma financiera', MARGEN + 8, y, { f: negrita, s: 10.5, color: BLANCO });
  y -= 20;
  filasPf.forEach((f) => {
    const principal = f.tipo !== 'cuenta';
    const tono = f.monto < 0 ? ROJO : f.tipo === 'margen' ? VERDE : f.tipo === 'operacion' ? NARANJA : NEGRO;
    if (f.tipo === 'ebitda') hoja.drawRectangle({ x: MARGEN, y: y - 5, width: ANCHO - MARGEN * 2, height: ALTO_PF, color: SUAVE });
    if (f.tipo === 'cuenta' || f.tipo === 'ebitda') texto(f.etiqueta, X_ETQ, y, { f: negrita, s: 9, derecha: true });
    else texto(f.etiqueta, MARGEN + 8, y, { f: negrita, s: 9.5, color: tono });
    texto(clp(f.monto), X_MONTO, y, { f: negrita, s: principal ? 9.5 : 9, derecha: true, color: f.tipo === 'cuenta' ? NEGRO : tono });
    texto(f.porcentaje, X_PCT, y, { f: negrita, s: principal ? 9.5 : 9, derecha: true, color: f.tipo === 'cuenta' ? NEGRO : tono });
    if (['ingresos', 'margen', 'operacion'].includes(f.tipo)) {
      hoja.drawLine({ start: { x: MARGEN, y: y - 5 }, end: { x: ANCHO - MARGEN, y: y - 5 }, thickness: 0.6, color: BANDA });
    }
    y -= ALTO_PF;
  });
  const BASE_PF = y + ALTO_PF - 5;
  [X_ETQ + 5, X_MONTO + 6].forEach((x) => hoja.drawLine({ start: { x, y: TOPE_PF - 6 }, end: { x, y: BASE_PF }, thickness: 0.5, color: LINEA }));
  hoja.drawRectangle({ x: MARGEN, y: BASE_PF, width: ANCHO - MARGEN * 2, height: TOPE_PF + 14 - BASE_PF, borderColor: BANDA, borderWidth: 0.75 });

  // Detalle: parte en una hoja nueva.
  abrirHoja();
  texto('Estado de resultados completo', MARGEN, y, { f: negrita, s: 14 });
  y -= 24;

  const encabezado = () => {
    hoja.drawRectangle({ x: MARGEN, y: y - 6, width: ANCHO - MARGEN * 2, height: 19, color: BANDA });
    texto('Cuenta', MARGEN + 6, y, { f: negrita, s: 9, color: BLANCO });
    texto('Monto', X_MONTO, y, { f: negrita, s: 9, color: BLANCO, derecha: true });
    texto('% ventas', X_PCT, y, { f: negrita, s: 9, color: BLANCO, derecha: true });
    y -= 21;
  };
  const nuevaHoja = () => { abrirHoja(); encabezado(); };
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
    hoja.drawLine({ start: { x: MARGEN, y: 64 }, end: { x: ANCHO - MARGEN, y: 64 }, thickness: 0.75, color: LINEA });
    cortar(nota, normal, 8, ANCHO - MARGEN * 2).forEach((l, n) => texto(l, MARGEN, 53 - n * 10, { s: 8, color: GRIS }));
    marca(MARGEN, 18, 13);
    texto(`www.nicopacheco.cl · Página ${i + 1} de ${hojas.length}`, ANCHO - MARGEN, 21, { s: 8, color: GRIS, derecha: true });
  });
  return pdf.save();
}

export function nombreArchivo(estado) {
  const nombre = (estado.negocio.nombre || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${['diagnostico-pyme', nombre, estado.negocio.periodo].filter(Boolean).join('-')}.pdf`;
}
