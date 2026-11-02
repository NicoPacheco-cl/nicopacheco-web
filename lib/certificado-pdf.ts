import "server-only";
import { degrees, PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { ALCANCE, AVISO_LEGAL, CRECIMIENTO_MAX, DOCS_CERT, METODOLOGIA, pct, PLANES_CERT, type PlanCert } from "./certificado";
import { analisisDe, datosEfectivos, nivelVerificado, planDe, vigencia } from "./certificados-servidor";
import { clp, fmtPts, pctTxt } from "./valorizacion";
import { mesTexto, type Periodo } from "./carpeta";
import type { Certificado } from "./certificados-servidor";

// PDF del certificado de valorización (A4), con timbre «Certificado por Nico Pacheco».
// Usa las fuentes estándar del PDF (Helvetica/Times) para no depender de archivos externos.

const AZUL = rgb(13 / 255, 13 / 255, 13 / 255); // negro de la marca
const ORO = rgb(62 / 255, 111 / 255, 138 / 255); // azul de la chaqueta
const ORO_OSC = rgb(44 / 255, 84 / 255, 106 / 255);
const GRIS = rgb(92 / 255, 92 / 255, 92 / 255);
const LINEA = rgb(222 / 255, 218 / 255, 210 / 255);
const SUAVE = rgb(242 / 255, 239 / 255, 233 / 255);
const TINTA = rgb(13 / 255, 13 / 255, 13 / 255);
const ROJO = rgb(181 / 255, 70 / 255, 42 / 255);

const W = 595.28;
const H = 841.89;
const MX = 48;
const ANCHO = W - MX * 2;

const fecha = (s: string) =>
  new Date(s).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Santiago" });

export async function pdfCertificado(c: Certificado, o: { ejemplo?: boolean; periodos?: Periodo[] } = {}) {
  const a = analisisDe(c);
  const d = datosEfectivos(c);
  const nivel = nivelVerificado(c);
  const planVisible: PlanCert = nivel ?? "standard";
  const planPedido = planDe(c);
  const vence = vigencia(c);
  const doc = await PDFDocument.create();
  doc.setTitle(`Certificado de valorización N° ${c.folio}`);
  doc.setAuthor("Nico Pacheco");
  doc.setSubject(`Valor de referencia de ${c.negocio}`);
  doc.setCreator("nicopacheco.cl");
  const f = await doc.embedFont(StandardFonts.Helvetica);
  const fb = await doc.embedFont(StandardFonts.HelveticaBold);
  const fi = await doc.embedFont(StandardFonts.HelveticaOblique);
  const ft = await doc.embedFont(StandardFonts.TimesRomanBold);

  // Las fuentes estándar solo tienen caracteres de Europa occidental: el resto se reemplaza.
  const limpio = (t: string) =>
    t.replace(/[−‒]/g, "-").replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/→/g, "->").replace(/[  ]/g, " ")
      .replace(/[^\x20-\x7e¡-ÿ–—‘’“”•…€]/g, "");
  const ancho = (t: string, fnt: PDFFont, s: number) => fnt.widthOfTextAtSize(limpio(t), s);
  const partir = (t: string, fnt: PDFFont, s: number, max: number) => {
    const out: string[] = [];
    for (const parrafo of limpio(t).split("\n")) {
      let l = "";
      for (const w of parrafo.split(" ")) {
        const prueba = l ? `${l} ${w}` : w;
        if (fnt.widthOfTextAtSize(prueba, s) > max && l) { out.push(l); l = w; } else l = prueba;
      }
      out.push(l);
    }
    return out;
  };

  let pg: PDFPage = doc.addPage([W, H]);
  let y = 0;
  const texto = (t: string, x: number, yy: number, o: { f?: PDFFont; s?: number; c?: ReturnType<typeof rgb> } = {}) =>
    pg.drawText(limpio(t), { x, y: yy, font: o.f ?? f, size: o.s ?? 10, color: o.c ?? TINTA });
  const derecha = (t: string, xDer: number, yy: number, o: { f?: PDFFont; s?: number; c?: ReturnType<typeof rgb> } = {}) =>
    texto(t, xDer - ancho(t, o.f ?? f, o.s ?? 10), yy, o);
  const parrafo = (t: string, o: { f?: PDFFont; s?: number; c?: ReturnType<typeof rgb>; x?: number; max?: number; lh?: number } = {}) => {
    const s = o.s ?? 10;
    for (const l of partir(t, o.f ?? f, s, o.max ?? ANCHO)) {
      espacio(s * (o.lh ?? 1.45) + 4);
      y -= s * (o.lh ?? 1.45);
      texto(l, o.x ?? MX, y, { f: o.f, s, c: o.c });
    }
  };

  const cabeceraChica = () => {
    pg.drawRectangle({ x: 0, y: H - 34, width: W, height: 34, color: AZUL });
    texto("NICO PACHECO", MX, H - 22, { f: fb, s: 12, c: rgb(1, 1, 1) });
    derecha(`Certificado de valorización N° ${c.folio}`, W - MX, H - 22, { s: 9, c: rgb(1, 1, 1) });
    y = H - 60;
  };
  // Salta de página si no cabe lo que viene.
  const espacio = (alto: number) => {
    if (y - alto < 70) { pg = doc.addPage([W, H]); cabeceraChica(); }
  };
  const titulo = (t: string) => {
    espacio(46);
    y -= 22;
    texto(t.toUpperCase(), MX, y, { f: fb, s: 9.5, c: ORO_OSC });
    y -= 6;
    pg.drawLine({ start: { x: MX, y }, end: { x: W - MX, y }, thickness: 0.8, color: LINEA });
    y -= 4;
  };

  // ---------- Página 1: resumen ejecutivo (todo lo estratégico en una sola plana) ----------
  const r = a.r;
  const emitido = fecha(c.pagado_en ?? c.creado_en);
  pg.drawRectangle({ x: 0, y: H - 92, width: W, height: 92, color: AZUL });
  pg.drawRectangle({ x: 0, y: H - 96, width: W, height: 4, color: ORO });
  texto("NICO PACHECO", MX, H - 48, { f: fb, s: 22, c: rgb(1, 1, 1) });
  texto("Mentor de pymes, director de empresas y conferencista", MX, H - 68, { s: 9, c: rgb(0.85, 0.85, 0.85) });
  derecha(`N° ${c.folio}`, W - MX, H - 46, { f: fb, s: 16, c: ORO });
  derecha(`Emitido el ${emitido}`, W - MX, H - 64, { s: 9, c: rgb(0.85, 0.88, 0.93) });

  y = H - 128;
  texto("Certificado de valorización", MX, y, { f: ft, s: 25, c: AZUL });
  derecha("Resumen ejecutivo", W - MX, y + 2, { f: fi, s: 11, c: GRIS });
  y -= 20;
  const ficha: [string, string][] = [
    ["Negocio", c.negocio],
    ["Rubro", d.rubro || "No informado"],
    ["Ubicación", [d.comuna, d.region].filter(Boolean).join(", ") || "No informada"],
    ["Solicitado por", c.nombre],
  ];
  const mitad = ANCHO / 2;
  ficha.forEach(([k, v], i) => {
    const x = MX + (i % 2) * (mitad + 12), yy = y - Math.floor(i / 2) * 15;
    texto(k, x, yy, { s: 8.8, c: GRIS });
    const max = mitad - 92;
    let t = v;
    while (ancho(t, fb, 9.8) > max && t.length > 4) t = t.slice(0, -2);
    texto(t === v ? v : `${t.trimEnd()}…`, x + 74, yy, { f: fb, s: 9.8 });
  });
  y -= 26;

  // Franja del plan (Standard / Gold / Platinum)
  {
    const alto = 20;
    const P = PLANES_CERT[planVisible];
    const fondo = planVisible === "gold" ? rgb(0.99, 0.95, 0.82) : planVisible === "platinum" ? rgb(0.93, 0.94, 0.97) : SUAVE;
    const borde = planVisible === "gold" ? ORO_OSC : planVisible === "platinum" ? rgb(0.45, 0.5, 0.58) : LINEA;
    pg.drawRectangle({ x: MX, y: y - alto, width: ANCHO, height: alto, color: fondo, borderColor: borde, borderWidth: 0.8 });
    const tit = `VALORIZACIÓN ${P.nombre.toUpperCase()}`;
    const colorTit = planVisible === "standard" ? AZUL : planVisible === "gold" ? ORO_OSC : rgb(0.25, 0.29, 0.35);
    texto(tit, MX + 8, y - 13.5, { f: fb, s: 8.6, c: colorTit });
    let xEst = MX + 12 + ancho(tit, fb, 8.6);
    for (let i = 0; i < P.estrellas; i++) { pg.drawSvgPath(ESTRELLA, { x: xEst, y: y - 5.5, scale: 0.85, color: colorTit }); xEst += 9.5; }
    const enRevision = planPedido !== "standard" && !nivel;
    const det = enRevision
      ? `${c.revision === "rechazado" ? `No se pudieron verificar los documentos ${PLANES_CERT[planPedido].nombre}` : `Verificación ${PLANES_CERT[planPedido].nombre} en revisión`}: esta versión usa solo lo declarado.`
      : P.corto;
    const xDet = xEst + 6;
    const venceTxt = vence ? `Vigente hasta ${fecha(vence.toISOString())}` : "";
    if (venceTxt) derecha(venceTxt, W - MX - 8, y - 13.2, { f: fb, s: 7.6, c: colorTit });
    const maxDet = W - MX - 8 - (venceTxt ? ancho(venceTxt, fb, 7.6) + 12 : 0) - xDet;
    // Si el texto largo no cabe en la franja, va solo la etiqueta (p. ej. «Validada con tus documentos»).
    const base = !enRevision && ancho(det, f, 7.6) > maxDet ? P.etiqueta : det;
    const tam = base !== det && ancho(base, f, 7.6) > maxDet ? 6.8 : 7.6; // la etiqueta cabe entera con letra algo menor
    let t = base;
    while (ancho(t, f, tam) > maxDet && t.length > 10) t = t.slice(0, -2);
    texto(t === base ? t : `${t.trimEnd()}…`, xDet, y - 13.2, { s: tam, c: TINTA });
    y -= alto + 8;
  }

  // Valor y timbre
  const altoValor = 100;
  pg.drawRectangle({ x: MX, y: y - altoValor, width: ANCHO, height: altoValor, color: SUAVE, borderColor: LINEA, borderWidth: 1 });
  pg.drawRectangle({ x: MX, y: y - altoValor, width: 5, height: altoValor, color: ORO });
  texto("VALOR DE REFERENCIA DEL DERECHO DE LLAVE", MX + 20, y - 20, { f: fb, s: 8.5, c: GRIS });
  texto(clp(a.valor), MX + 20, y - 52, { f: fb, s: 30, c: AZUL });
  texto(`Rango según métodos de contraste: ${clp(a.rango[0])} a ${clp(a.rango[1])}`, MX + 20, y - 72, { s: 9.2, c: TINTA });
  texto(a.nivel + ".", MX + 20, y - 87, { f: fi, s: 8.6, c: GRIS });
  timbre(pg, W - MX - 50, y - altoValor / 2, 40, c.folio, emitido, f, fb);
  selloPlan(pg, planVisible, W - MX - 50 - 40 - 42, y - altoValor / 2, 33, f, fb);
  y -= altoValor + 8;

  const sii = r.sii;
  if (nivel) {
    // Gold y Platinum verificados: sello propio «Verificado con información del SII».
    // Es un sello de Nico Pacheco, no el logo oficial del SII (que no se puede usar sin autorización).
    const alto = 64; // 24 oct 2026: sello más grande (pedido de Nico)
    const verde = rgb(30 / 255, 123 / 255, 87 / 255);
    pg.drawRectangle({ x: MX, y: y - alto, width: ANCHO, height: alto, color: rgb(0.93, 0.97, 0.95), borderColor: verde, borderWidth: 1 });
    pg.drawRectangle({ x: MX, y: y - alto, width: 5, height: alto, color: verde });
    selloSii(pg, MX + 42, y - alto / 2, 26, fb, verde);
    const x0 = MX + 80;
    texto("VERIFICADO CON INFORMACIÓN DEL SII", x0, y - 20, { f: fb, s: 12, c: verde });
    const meses = sii?.meses ?? 12;
    const hasta = sii?.ultimo ? ` (hasta ${mesTexto(sii.ultimo)})` : "";
    texto(`Ventas contrastadas con los F29 de ${meses} meses${hasta} de la carpeta tributaria electrónica del SII.`, x0, y - 36, { s: 7.9, c: TINTA });
    texto("Sello de Nico Pacheco: indica la fuente de la verificación; no es un documento emitido por el SII.", x0, y - 49, { f: fi, s: 7.4, c: GRIS });
    y -= alto + 8;
  } else if (sii && sii.estado !== "revision") {
    const alto = 30;
    const verde = rgb(30 / 255, 123 / 255, 87 / 255);
    pg.drawRectangle({ x: MX, y: y - alto, width: ANCHO, height: alto, color: rgb(0.93, 0.97, 0.95), borderColor: verde, borderWidth: 1 });
    texto(sii.coincide ? "VENTAS VERIFICADAS CON EL SII" : "VENTAS TOMADAS DE LO DECLARADO AL SII", MX + 12, y - 12, { f: fb, s: 8.6, c: verde });
    texto(sii.coincide
      ? `La venta coincide con los F29 de ${sii.meses} meses (hasta ${mesTexto(sii.ultimo)}) de la carpeta tributaria electrónica.`
      : `La venta escrita difería ${Math.round(Math.abs(sii.diferencia ?? 0) * 100)}% de los F29 de ${sii.meses} meses: se usó lo declarado al SII.`, MX + 12, y - 24, { s: 8, c: TINTA });
    y -= alto + 8;
  }

  // Indicadores clave (2 filas de 4)
  const subtitulo = (t: string, x: number, yy: number, w: number) => {
    texto(t.toUpperCase(), x, yy, { f: fb, s: 8.4, c: ORO_OSC });
    pg.drawLine({ start: { x, y: yy - 4 }, end: { x: x + w, y: yy - 4 }, thickness: 0.7, color: LINEA });
  };
  y -= 12;
  subtitulo("Indicadores clave", MX, y, ANCHO);
  y -= 10;
  const R = Number(String(d.mesesRestantes ?? "").replace(/\D/g, "")) || 0;
  const m2 = String(d.m2 ?? "").replace(/\D/g, "");
  const dec = (x: number, k = 1) => x.toFixed(k).replace(".", ",");
  const kpis: [string, string, string][] = [
    ["Venta neta mensual", clp(r.ventaNeta), sii?.coincide ? "verificada con el SII" : "declarada"],
    ["Utilidad normalizada", clp(r.utilidadNormalizada), r.sueldoReemplazo ? `con sueldo de reemplazo` : "al mes"],
    ["Margen", pct(a.margen), "utilidad ÷ venta neta"],
    ["Múltiplo de mercado", `${dec(r.multiplo, 2)} veces`, `utilidad anual · ${r.tamano}`],
    ["Puntaje de calidad", `${fmtPts(r.puntaje)} / 100`, `factor ×${dec(r.factor, 2)}${r.techo ? ` · techo ${r.techo.valor}` : ""}`],
    ["Contrato de arriendo", R ? `${R} meses` : "Sin dato", r.topeAplicado ? "limita el valor (tope)" : "meses que quedan"],
    ["Recuperación", r.utilidadNormalizada ? `${dec(r.mesesRecupero)} meses` : "-", m2 ? `de utilidad · ${m2} m²` : "de utilidad"],
    r.entorno.lineas.length
      ? ["Ajuste por entorno", r.entorno.pct ? pctTxt(r.entorno.pct) : "0%", r.entorno.monto ? `${r.entorno.monto > 0 ? "+" : "-"}${clp(Math.abs(r.entorno.monto))}` : "sin efecto"]
      : ["Deudas descontadas", clp(r.totalDeudas), r.totalDeudas ? "se restan del precio" : "sin deudas declaradas"],
  ];
  const gap = 8, tw = (ANCHO - gap * 3) / 4, th = 38;
  kpis.forEach(([k, v, sub], i) => {
    const x = MX + (i % 4) * (tw + gap), top = y - Math.floor(i / 4) * (th + gap);
    pg.drawRectangle({ x, y: top - th, width: tw, height: th, color: rgb(1, 1, 1), borderColor: LINEA, borderWidth: 0.8 });
    texto(k.toUpperCase(), x + 7, top - 11, { f: fb, s: 6.4, c: GRIS });
    texto(v, x + 7, top - 24, { f: fb, s: 11.5, c: k === "Ajuste por entorno" && r.entorno.pct < 0 ? ROJO : AZUL });
    texto(sub, x + 7, top - 33, { s: 6.6, c: GRIS });
  });
  y -= th * 2 + gap + 16;

  // Dos columnas: puntaje por dimensión | del valor base al valor certificado
  const colW = (ANCHO - 18) / 2, xDer = MX + colW + 18;
  subtitulo("Puntaje por dimensión", MX, y, colW);
  subtitulo("Cómo se llega al valor", xDer, y, colW);
  const top2 = y - 8;
  let yi = top2;
  for (const dm of a.dimensiones) {
    yi -= 11.2;
    const p = dm.max ? dm.puntos / dm.max : 0;
    texto(`${dm.n}. ${dm.titulo}`, MX, yi, { s: 7.8, c: TINTA });
    const bx = MX + 118, bw = colW - 118 - 44;
    pg.drawRectangle({ x: bx, y: yi, width: bw, height: 5, color: SUAVE, borderColor: LINEA, borderWidth: 0.4 });
    pg.drawRectangle({ x: bx, y: yi, width: bw * Math.max(0, Math.min(1, p)), height: 5, color: p >= 0.6 ? ORO : ROJO });
    derecha(`${fmtPts(dm.puntos)}/${fmtPts(dm.max)}`, MX + colW, yi, { s: 7.8, c: p >= 0.6 ? TINTA : ROJO });
  }
  const filasValor: [string, number, boolean?][] = [
    [`Valor base (utilidad × 12 × ${dec(r.multiplo, 2)})`, r.base, true],
    [`Ajuste por calidad (×${dec(r.factor, 2)})`, r.ajustado - r.base],
  ];
  if (r.entorno.monto) filasValor.push([`Entorno (${pctTxt(r.entorno.pct)})`, r.entorno.monto]);
  if (r.topeAplicado) filasValor.push([`Tope por contrato (${Math.round(r.pctTope * 100)}% de ${r.mesesContrato} meses)`, r.topeContrato - r.conEntorno]);
  if (r.prima.monto && r.prima.nivel) filasValor.push([`Información verificada ${PLANES_CERT[r.prima.nivel].nombre} (${pctTxt(r.prima.pct)})`, r.prima.monto]);
  if (r.descuentoMarca) filasValor.push(["Sin marca (-10%)", -r.descuentoMarca]);
  if (r.pisoAplicado) filasValor.push(["Piso por valor de los equipos", r.piso - r.conTope]);
  if (r.mercaderia) filasValor.push(["Mercadería en bodega", r.mercaderia]);
  if (r.vehiculos) filasValor.push(["Vehículos incluidos", r.vehiculos]);
  if (r.totalDeudas) filasValor.push([`Deudas declaradas (${r.deudas.length})`, -r.totalDeudas]);
  let yv = top2;
  for (const [t, m, total] of filasValor) {
    yv -= 12.5;
    texto(t, xDer, yv, { s: 8, c: TINTA });
    derecha(total ? clp(m) : `${m < 0 ? "- " : "+ "}${clp(Math.abs(m))}`, xDer + colW, yv, { s: 8, c: m < 0 ? ROJO : TINTA });
  }
  yv -= 6;
  pg.drawLine({ start: { x: xDer, y: yv + 2 }, end: { x: xDer + colW, y: yv + 2 }, thickness: 0.6, color: LINEA });
  yv -= 10;
  texto("Valor certificado", xDer, yv, { f: fb, s: 9, c: AZUL });
  derecha(clp(r.valor), xDer + colW, yv, { f: fb, s: 9, c: AZUL });
  if (r.saldoCaja > 0) { yv -= 11; texto(`+ saldo en cuenta si se traspasa: ${clp(r.saldoCaja)}`, xDer, yv, { s: 7.2, c: GRIS }); }
  y = Math.min(yi, yv) - 18;

  // Dos columnas: fortalezas | riesgos y oportunidades
  const lista = (titulo: string, items: string[], x: number, color: ReturnType<typeof rgb>) => {
    subtitulo(titulo, x, y, colW);
    let yy = y - 6;
    if (!items.length) { yy -= 11; texto("Sin observaciones destacadas.", x, yy, { f: fi, s: 7.8, c: GRIS }); }
    for (const it of items.slice(0, 4)) {
      const ls = partir(it, f, 7.8, colW - 10).slice(0, 2);
      ls.forEach((l, i) => {
        yy -= 10.2;
        if (i === 0) pg.drawCircle({ x: x + 2.5, y: yy + 2.6, size: 1.6, color });
        texto(i === 1 && ls.length === 2 && partir(it, f, 7.8, colW - 10).length > 2 ? `${l.replace(/[.,;:]?$/, "")}…` : l, x + 9, yy, { s: 7.8, c: TINTA });
      });
      yy -= 2.5;
    }
    return yy;
  };
  const yF = lista("Fortalezas", a.fortalezas, MX, AZUL);
  const yR = lista("Riesgos y oportunidades", a.riesgos, xDer, ROJO);
  y = Math.min(yF, yR) - 14;

  // Qué se vende y entorno, en una línea cada uno
  const linea = (k: string, v: string) => {
    if (y < 64) return;
    const ls = partir(v, f, 7.8, ANCHO - 92).slice(0, 2);
    texto(k, MX, y, { f: fb, s: 7.8, c: ORO_OSC });
    ls.forEach((l, i) => texto(l, MX + 92, y - i * 10, { s: 7.8, c: TINTA }));
    y -= ls.length * 10 + 3;
  };
  subtitulo("Contexto de la venta", MX, y, ANCHO);
  y -= 14;
  linea("Qué se vende", a.venta.filter((x) => x.t !== "Puntaje").map((x) => `${x.t}: ${x.v.toLowerCase()}`).join(" · ") + ".");
  const entornoTxt = r.dimensiones.find((x) => x.id === "entorno")?.efectoValor?.map((x) => x.pct ? `${x.t.split(":")[0]} (${pctTxt(x.pct)})` : x.t) ?? [];
  linea("Entorno", entornoTxt.length ? entornoTxt.join(" · ") + "." : "No informado: no ajusta el valor.");
  if (r.techo) linea("Atención", `Puntaje limitado a ${r.techo.valor} porque ${r.techo.motivo}.`);

  // El detalle completo parte en la página 2.
  pg = doc.addPage([W, H]);
  cabeceraChica();
  y += 8;

  titulo("Alcance");
  parrafo(ALCANCE, { s: 9.5 });

  // ---------- Qué incluye la venta ----------
  titulo("Qué incluye la venta");
  for (const x of a.venta) {
    espacio(30);
    y -= 13;
    texto(x.t, MX, y, { s: 9.5, c: GRIS });
    texto(x.v, MX + 150, y, { f: fb, s: 10 });
    parrafo(x.nota, { s: 8.6, c: GRIS, x: MX + 150, max: ANCHO - 150, lh: 1.35 });
    y -= 2;
  }

  // ---------- Documentos verificados (Gold y Platinum) ----------
  if (planPedido !== "standard") {
    titulo(nivel ? `Documentos verificados (${PLANES_CERT[planPedido].nombre})` : `Documentos (${PLANES_CERT[planPedido].nombre}, sin verificar)`);
    parrafo(nivel
      ? `Nico Pacheco revisó estos documentos el ${fecha(c.revisado_en!)}: ${c.lectura?.estado === "listo" ? "una inteligencia artificial los leyó página por página, extrajo sus cifras y las contrastó" : "se revisaron sus cifras y se contrastaron"} con lo declarado según reglas fijas; las diferencias se corrigieron con la cifra del documento. Por eso el valor incluye ${pctTxt(PLANES_CERT[planPedido].prima)} de prima por información verificada.`
      : c.revision === "rechazado" ? "Los documentos no se pudieron verificar: el certificado se emite como Standard, sin prima." : "La revisión de los documentos está en curso: esta versión se calcula solo con lo declarado.", { s: 8.8, c: GRIS, lh: 1.4 });
    for (const tipo of PLANES_CERT[planPedido].docs) {
      const it = c.verificacion?.items?.[tipo];
      const estado = !nivel && !it ? "pendiente" : it?.ok === false ? "con observación" : "verificado";
      espacio(16); y -= 13;
      texto(DOCS_CERT[tipo].t, MX, y, { s: 9, c: TINTA });
      derecha(estado, W - MX, y, { f: fb, s: 8.8, c: estado === "verificado" ? rgb(30 / 255, 123 / 255, 87 / 255) : estado === "pendiente" ? GRIS : ROJO });
      if (it?.nota) parrafo(it.nota, { s: 8.2, c: GRIS, x: MX + 10, max: ANCHO - 120, lh: 1.3 });
    }
    const k = c.verificacion?.correcciones;
    if (k?.ventaNeta || k?.utilidadMensual) parrafo(`Cifras corregidas con los documentos: ${[k.ventaNeta ? `venta neta mensual ${clp(Number(k.ventaNeta))}` : "", k.utilidadMensual ? `utilidad mensual ${clp(Number(k.utilidadMensual))}` : ""].filter(Boolean).join(" y ")}.`, { f: fb, s: 8.8, c: TINTA });
    if (c.revision_nota) parrafo(`Nota de la revisión: ${c.revision_nota}`, { f: fi, s: 8.6, c: GRIS });
  }

  // ---------- Resumen ----------
  // El resumen va completo en una sola hoja: se mide antes y, si no cabe, parte en la hoja siguiente.
  {
    const lineas = (t: string, fnt: PDFFont, sz: number, max: number, lh: number) => partir(t, fnt, sz, max).length * (sz * lh + 0);
    let alto = 46 + 40 + 16 + lineas(a.nivel + ".", fi, 9.5, ANCHO, 1.45);
    if (a.fortalezas.length) alto += 24 + a.fortalezas.reduce((t, l) => t + lineas(`• ${l}`, f, 9, ANCHO - 8, 1.4), 0);
    if (a.riesgos.length) alto += 24 + a.riesgos.reduce((t, l) => t + lineas(`• ${l}`, f, 9, ANCHO - 8, 1.4), 0);
    espacio(alto + 10);
  }
  titulo("Resumen del analista");
  espacio(40);
  y -= 16;
  texto(`Puntaje de calidad: ${fmtPts(a.r.puntaje)} de 100`, MX, y, { f: fb, s: 12, c: AZUL });
  derecha(`Factor sobre el múltiplo: ${String(Math.round(a.r.factor * 100) / 100).replace(".", ",")}`, W - MX, y, { f: fb, s: 10, c: ORO_OSC });
  y -= 4;
  // barra del puntaje
  espacio(16);
  y -= 10;
  pg.drawRectangle({ x: MX, y, width: ANCHO, height: 6, color: SUAVE, borderColor: LINEA, borderWidth: 0.5 });
  pg.drawRectangle({ x: MX, y, width: (ANCHO * Math.max(0, Math.min(100, a.r.puntaje))) / 100, height: 6, color: ORO });
  parrafo(a.nivel + ".", { f: fi, s: 9.5, c: TINTA });
  if (a.fortalezas.length) {
    espacio(24); y -= 14; texto("Fortalezas", MX, y, { f: fb, s: 9.5, c: AZUL });
    for (const l of a.fortalezas) parrafo(`• ${l}`, { s: 9, c: TINTA, x: MX + 8, max: ANCHO - 8, lh: 1.4 });
  }
  if (a.riesgos.length) {
    espacio(24); y -= 14; texto("Riesgos y oportunidades", MX, y, { f: fb, s: 9.5, c: ROJO });
    for (const l of a.riesgos) parrafo(`• ${l}`, { s: 9, c: TINTA, x: MX + 8, max: ANCHO - 8, lh: 1.4 });
  }

  // ---------- Cómo se llega al valor ----------
  titulo("Cómo se llega al valor");
  for (const p of a.pasos) {
    espacio(p.nota ? 34 : 20);
    y -= 14;
    if (p.total) pg.drawLine({ start: { x: MX, y: y + 11 }, end: { x: W - MX, y: y + 11 }, thickness: 0.6, color: LINEA });
    texto(p.t, MX, y, { f: p.total ? fb : f, s: 9.8, c: p.total ? AZUL : TINTA });
    const txt = p.total ? clp(p.monto) : `${p.monto < 0 ? "- " : "+ "}${clp(Math.abs(p.monto))}`;
    derecha(txt, W - MX, y, { f: p.total ? fb : f, s: 9.8, c: p.monto < 0 && !p.total ? ROJO : p.total ? AZUL : TINTA });
    if (p.nota) parrafo(p.nota, { s: 8.5, c: GRIS, x: MX + 8, max: ANCHO - 120, lh: 1.35 });
  }

  // ---------- Métodos ----------
  titulo("Métodos de valorización");
  for (const m of a.metodos) {
    espacio(40);
    y -= 13;
    texto(m.nombre, MX, y, { f: fb, s: 10.5, c: m.id === "criterios" ? AZUL : TINTA });
    derecha(clp(m.valor), W - MX, y, { f: fb, s: 10.5, c: m.id === "criterios" ? AZUL : TINTA });
    parrafo(m.detalle, { s: 8.8, c: GRIS, max: ANCHO - 110, lh: 1.4 });
    y -= 3;
  }
  espacio(30);
  parrafo("El valor certificado es el del múltiplo ajustado por calidad. El múltiplo de mercado sin ajustar y los flujos descontados sirven de contraste y definen el rango de referencia.", { f: fi, s: 8.8, c: GRIS });

  // ---------- Metodología ----------
  titulo("Por qué se valoriza así");
  for (const l of METODOLOGIA) { parrafo(l, { s: 9, c: TINTA, lh: 1.42 }); y -= 4; }

  // ---------- Análisis por dimensión ----------
  titulo("Análisis por dimensión (100 puntos)");
  for (const dm of a.dimensiones) {
    espacio(90);
    y -= 18;
    pg.drawRectangle({ x: MX, y: y - 6, width: ANCHO, height: 22, color: SUAVE });
    texto(`${dm.n}. ${dm.titulo}`, MX + 8, y, { f: fb, s: 11, c: AZUL });
    derecha(`${fmtPts(dm.puntos)} / ${fmtPts(dm.max)} pts`, W - MX - 8, y, { f: fb, s: 11, c: dm.puntos / dm.max >= 0.6 ? AZUL : ROJO });
    y -= 6;
    parrafo(`Por qué pesa ${fmtPts(dm.max)} puntos: ${dm.porQue}`, { f: fi, s: 8.6, c: GRIS, lh: 1.38 });
    y -= 2;
    for (const it of dm.items) {
      const lineas = partir(it.nota ? `${it.t}: ${it.nota}` : it.t, f, 8.8, ANCHO - 70);
      espacio(lineas.length * 12 + 4);
      lineas.forEach((l, i) => {
        y -= 12;
        texto(i === 0 ? `• ${l}` : `  ${l}`, MX + 6, y, { s: 8.8, c: TINTA });
        if (i === 0) derecha(`${fmtPts(it.pts)} / ${fmtPts(it.max)}`, W - MX, y, { s: 8.8, c: it.pts >= it.max ? AZUL : it.pts === 0 ? ROJO : TINTA });
      });
    }
    for (const e of dm.efectoValor ?? []) {
      if (!e.pct) continue;
      const ls = partir(`Efecto directo en el valor: ${e.t}`, f, 8.8, ANCHO - 70);
      espacio(ls.length * 12 + 4);
      ls.forEach((l, i) => {
        y -= 12;
        texto(i === 0 ? `• ${l}` : `  ${l}`, MX + 6, y, { s: 8.8, c: TINTA });
        if (i === 0) derecha(pctTxt(e.pct), W - MX, y, { f: fb, s: 8.8, c: e.pct < 0 ? ROJO : AZUL });
      });
    }
    if (dm.penalizacion > 0) {
      espacio(16); y -= 13;
      texto(`• Deuda declarada de ${clp(dm.deuda)}`, MX + 6, y, { f: fb, s: 8.8, c: ROJO });
      derecha(`- ${fmtPts(dm.penalizacion)}`, W - MX, y, { f: fb, s: 8.8, c: ROJO });
    }
    y -= 2;
    parrafo(dm.lectura, { s: 8.8, c: TINTA, lh: 1.38 });
    if (dm.aporte > 0 || dm.potencial > 0)
      parrafo(`Efecto en el valor: aporta cerca de ${clp(dm.aporte)}${dm.potencial > 0 ? `; completarla podría sumar hasta ${clp(dm.potencial)}` : ""}${a.r.topeAplicado ? " (hoy el valor está limitado por el contrato)" : ""}.`, { s: 8.6, c: GRIS, lh: 1.35 });
    if (dm.mejoras.length) {
      espacio(16); y -= 12; texto("Cómo mejorar:", MX, y, { f: fb, s: 8.6, c: ORO_OSC });
      for (const m of dm.mejoras) parrafo(`- ${m}`, { s: 8.6, c: TINTA, x: MX + 8, max: ANCHO - 8, lh: 1.35 });
    }
    y -= 4;
  }

  // ---------- Proyección ----------
  // ---------- Ventas y compras declaradas al SII ----------
  if (sii && sii.estado !== "revision") {
    titulo("Ventas y compras declaradas al SII");
    parrafo(`Fuente: formularios F29 de la carpeta tributaria electrónica entregada por el solicitante${a.r.sii?.estado === "verificada" ? ", verificada por Nico Pacheco en el sitio del SII" : ""}. Ventas = ingresos brutos del mes (código 563); compras = créditos de IVA (código 537) divididos por 0,19.`, { s: 8.8, c: GRIS, lh: 1.4 });
    const filas: [string, string][] = [
      [`Ventas netas de los últimos ${sii.meses} meses`, clp(sii.ventasAnual)],
      ["Promedio mensual de ventas", clp(sii.ventaMensual)],
      ["Compras con IVA del período (promedio mensual)", clp(sii.compraMensual)],
      ["Venta escrita por el solicitante (mensual)", clp(sii.declarada)],
    ];
    if (sii.ventasAnualAnterior) filas.push(["Ventas de los 12 meses anteriores", `${clp(sii.ventasAnualAnterior)} (${sii.ventasAnual >= sii.ventasAnualAnterior ? "+" : ""}${(((sii.ventasAnual / sii.ventasAnualAnterior) - 1) * 100).toFixed(1).replace(".", ",")}%)`]);
    for (const [k, v] of filas) { espacio(16); y -= 14; texto(k, MX, y, { s: 9.2, c: GRIS }); derecha(v, W - MX, y, { f: fb, s: 9.2 }); }
    const ps = (o.periodos ?? []).slice(0, 12);
    if (ps.length) {
      espacio(30); y -= 20;
      texto("Mes", MX, y, { f: fb, s: 8.8, c: GRIS }); derecha("Ventas netas", MX + 300, y, { f: fb, s: 8.8, c: GRIS }); derecha("Compras con IVA", W - MX, y, { f: fb, s: 8.8, c: GRIS });
      for (const p of ps) { espacio(14); y -= 12; texto(mesTexto(p.periodo), MX, y, { s: 8.8 }); derecha(clp(p.ventas), MX + 300, y, { s: 8.8 }); derecha(p.compras ? clp(p.compras) : "-", W - MX, y, { s: 8.8 }); }
    }
    y -= 6;
  }

  titulo("Crecimiento y proyecciones");
  parrafo(a.crecimiento === null
    ? "No se informó la venta de hace 12 meses: las proyecciones suponen ventas estables (0% de crecimiento)."
    : `La venta neta mensual cambió ${a.crecimiento >= 0 ? "+" : ""}${pct(a.crecimiento)} en 12 meses.${Math.abs(a.crecimiento) > CRECIMIENTO_MAX ? ` Para proyectar se usa ${pct(a.crecimientoProyectado)} (máximo ±${pct(CRECIMIENTO_MAX)} anual).` : ""}`, { s: 9, c: TINTA });
  const c1 = MX, c2 = MX + 170, c3 = W - MX;
  espacio(30);
  y -= 16;
  texto("Año", c1, y, { f: fb, s: 9, c: GRIS });
  derecha("Venta neta anual", c2 + 110, y, { f: fb, s: 9, c: GRIS });
  derecha("Utilidad anual normalizada", c3, y, { f: fb, s: 9, c: GRIS });
  y -= 6;
  for (const p of a.proyeccion) {
    espacio(18);
    y -= 13;
    texto(`Año ${p.ano}`, c1, y, { s: 9.5 });
    derecha(clp(p.venta), c2 + 110, y, { s: 9.5 });
    derecha(clp(p.utilidad), c3, y, { s: 9.5 });
  }
  y -= 6;
  parrafo(`Crecimiento usado: ${pct(a.crecimientoProyectado)} anual, con margen constante de ${pct(a.margen)}. Las proyecciones son estimaciones, no garantías de resultados.`, { f: fi, s: 8.8, c: GRIS });

  // ---------- Aviso legal y firma ----------
  titulo("Aviso legal");
  for (const l of AVISO_LEGAL) {
    const t = nivel && l.startsWith("El cálculo se basa exclusivamente")
      ? "El cálculo se basa en la información declarada por el solicitante, contrastada con los documentos de la sección «Documentos verificados». Las ventas se verifican con lo declarado al SII; la utilidad no se verifica: se revisa que sea coherente con lo tributario. La revisión de los documentos no es una auditoría: si los documentos entregados son falsos o incompletos, el valor también lo será."
      : l;
    parrafo(t, { s: 8.8, c: TINTA, lh: 1.4 }); y -= 3;
  }
  espacio(110);
  y -= 30;
  timbre(pg, MX + 52, y - 40, 44, c.folio, fecha(c.pagado_en ?? c.creado_en), f, fb);
  texto("Nico Pacheco", MX + 120, y - 26, { f: fb, s: 12, c: AZUL });
  texto("nicopacheco.cl · nikolaspacheco@gmail.com", MX + 120, y - 42, { s: 9, c: GRIS });
  texto(`Certificado N° ${c.folio} · código ${c.id.slice(0, 8).toUpperCase()}`, MX + 120, y - 56, { s: 9, c: GRIS });

  // Pie con número de página en todas las hojas
  const paginas = doc.getPages();
  paginas.forEach((p, i) => {
    p.drawLine({ start: { x: MX, y: 42 }, end: { x: W - MX, y: 42 }, thickness: 0.5, color: LINEA });
    if (o.ejemplo) {
      // Marca de agua: el ejemplo usa datos ficticios y no es un certificado válido.
      p.drawText("EJEMPLO", { x: 120, y: 250, size: 120, font: fb, color: ORO, opacity: 0.13, rotate: degrees(40) });
    }
    p.drawText(limpio(o.ejemplo ? "EJEMPLO con datos ficticios · no es un certificado válido ni una tasación." : `Certificado N° ${c.folio} · Valor de referencia: no es una tasación pericial ni una oferta.`), { x: MX, y: 28, size: 7.5, font: f, color: GRIS });
    const t = `Página ${i + 1} de ${paginas.length}`;
    p.drawText(limpio(t), { x: W - MX - f.widthOfTextAtSize(limpio(t), 7.5), y: 28, size: 7.5, font: f, color: GRIS });
  });

  return doc.save();
}

// Timbre circular: texto en arco «CERTIFICADO POR NICO PACHECO», sigla al centro, folio y fecha.
function timbre(pg: PDFPage, cx: number, cy: number, r: number, folio: number, fechaTxt: string, f: PDFFont, fb: PDFFont) {
  const giro = -12; // un poco inclinado, como un timbre real
  const rot = (x: number, yy: number) => {
    const a = (giro * Math.PI) / 180;
    return { x: cx + x * Math.cos(a) - yy * Math.sin(a), y: cy + x * Math.sin(a) + yy * Math.cos(a) };
  };
  pg.drawCircle({ x: cx, y: cy, size: r, borderColor: ORO_OSC, borderWidth: 2.2, color: rgb(0.96, 0.98, 0.99), opacity: 0.95 });
  pg.drawCircle({ x: cx, y: cy, size: r - 5, borderColor: ORO_OSC, borderWidth: 0.7 });
  pg.drawCircle({ x: cx, y: cy, size: r * 0.58, borderColor: ORO_OSC, borderWidth: 0.9 });

  // Texto en arco: arriba «CERTIFICADO POR», abajo «NICO PACHECO»
  const arco = (txt: string, centro: number, arriba: boolean) => {
    const s = r * 0.17;
    const rr = arriba ? r - 7 - s * 0.85 : r - 7 - s * 0.05;
    const total = fb.widthOfTextAtSize(txt, s) * 1.08;
    const paso = total / rr; // radianes que ocupa el texto
    let ang = arriba ? centro + paso / 2 : centro - paso / 2;
    for (const ch of txt) {
      const w = fb.widthOfTextAtSize(ch, s) * 1.08;
      const da = w / rr;
      const medio = arriba ? ang - da / 2 : ang + da / 2;
      const px = rr * Math.cos(medio), py = rr * Math.sin(medio);
      const tang = arriba ? medio - Math.PI / 2 : medio + Math.PI / 2;
      // Se corre medio carácter hacia atrás para centrarlo en su posición
      const ox = px - (w / 2.16) * Math.cos(tang), oy = py - (w / 2.16) * Math.sin(tang);
      const p = rot(ox, oy);
      pg.drawText(ch, { x: p.x, y: p.y, size: s, font: fb, color: ORO_OSC, rotate: degrees((tang * 180) / Math.PI + giro) });
      ang = arriba ? ang - da : ang + da;
    }
  };
  arco("CERTIFICADO POR", Math.PI / 2, true);
  arco("NICO PACHECO", -Math.PI / 2, false);
  for (const lado of [-1, 1]) {
    const p = rot(lado * (r - 7 - r * 0.08), -r * 0.03);
    pg.drawText("*", { x: p.x - 2, y: p.y - 2, size: r * 0.16, font: fb, color: ORO_OSC, rotate: degrees(giro) });
  }

  const centrado = (t: string, dy: number, fnt: PDFFont, s: number, c = ORO_OSC) => {
    const w = fnt.widthOfTextAtSize(t, s);
    const p = rot(-w / 2, dy);
    pg.drawText(t, { x: p.x, y: p.y, size: s, font: fnt, color: c, rotate: degrees(giro) });
  };
  centrado("NP", r * 0.06, fb, r * 0.36, AZUL);
  centrado(`N° ${folio}`, -r * 0.2, fb, r * 0.13);
  centrado(fechaTxt.replace(/ de /g, " ").toUpperCase(), -r * 0.36, f, r * 0.095);
}

// Sello del plan. Standard: sello azul simple. Gold y Platinum: sello holograma (anillos tornasol y rayos de luz).
const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const PALETAS: Record<"gold" | "platinum", string[]> = {
  gold: ["#7a5a12", "#c99a2e", "#f6dc7d", "#fff6c9", "#e0b443", "#a8781a", "#f9e69a", "#d8a93a"],
  platinum: ["#7d8a96", "#c9d1d8", "#f5f7fa", "#ead8f4", "#d2eef4", "#aeb9c3", "#ffffff", "#dfe6ec"],
};
const ESTRELLA = "M5 0 L6.18 3.62 L10 3.62 L6.91 5.86 L8.09 9.5 L5 7.25 L1.91 9.5 L3.09 5.86 L0 3.62 L3.82 3.62 Z";

function selloPlan(pg: PDFPage, plan: PlanCert, cx: number, cy: number, r: number, f: PDFFont, fb: PDFFont) {
  const centrado = (t: string, dy: number, fnt: PDFFont, s: number, c: ReturnType<typeof rgb>) =>
    pg.drawText(t, { x: cx - fnt.widthOfTextAtSize(t, s) / 2, y: cy + dy, size: s, font: fnt, color: c });
  if (plan === "standard") {
    pg.drawCircle({ x: cx, y: cy, size: r, color: rgb(1, 1, 1), borderColor: AZUL, borderWidth: 1.6 });
    pg.drawCircle({ x: cx, y: cy, size: r - 4, borderColor: AZUL, borderWidth: 0.5 });
    centrado("STANDARD", 1, fb, r * 0.25, AZUL);
    centrado("SIN", -r * 0.32, fb, r * 0.15, GRIS);
    centrado("VALIDACION", -r * 0.5, fb, r * 0.15, GRIS);
    return;
  }
  const pal = PALETAS[plan].map(hex);
  const oscuro = plan === "gold" ? hex("#5b3d00") : hex("#2b333d");
  // Disco tornasol: anillos concéntricos que recorren la paleta (efecto holograma).
  const pasos = 44;
  for (let i = 0; i < pasos; i++) {
    const rr = r * (1 - i / pasos);
    const t = (Math.sin(i * 0.55) + 1) / 2 * (pal.length - 1);
    const a = pal[Math.floor(t)], b = pal[Math.min(pal.length - 1, Math.floor(t) + 1)], k = t - Math.floor(t);
    pg.drawCircle({ x: cx, y: cy, size: rr, color: rgb(a.red + (b.red - a.red) * k, a.green + (b.green - a.green) * k, a.blue + (b.blue - a.blue) * k) });
  }
  // Rayos de luz
  for (let i = 0; i < 48; i++) {
    const ang = (i / 48) * Math.PI * 2;
    pg.drawLine({ start: { x: cx + Math.cos(ang) * r * 0.62, y: cy + Math.sin(ang) * r * 0.62 }, end: { x: cx + Math.cos(ang) * r * 0.97, y: cy + Math.sin(ang) * r * 0.97 }, thickness: 0.5, color: rgb(1, 1, 1), opacity: i % 2 ? 0.25 : 0.55 });
  }
  // Brillo diagonal
  pg.drawEllipse({ x: cx - r * 0.3, y: cy + r * 0.35, xScale: r * 0.45, yScale: r * 0.16, color: rgb(1, 1, 1), opacity: 0.35, rotate: degrees(25) });
  pg.drawCircle({ x: cx, y: cy, size: r, borderColor: oscuro, borderWidth: 1.4 });
  // Placa central más clara para que el texto se lea sobre el holograma.
  const placa = (plan === "gold" ? ["#f0cd6a", "#f7df92", "#fff3c4"] : ["#d5dde4", "#eef2f6", "#ffffff"]).map(hex);
  placa.forEach((c, i) => pg.drawCircle({ x: cx, y: cy, size: r * (0.62 - i * 0.08), color: c }));
  pg.drawCircle({ x: cx, y: cy, size: r * 0.62, borderColor: oscuro, borderWidth: 0.7 });
  const n = plan === "gold" ? 1 : 3, e = r * 0.2, sep = e * 1.1;
  for (let i = 0; i < n; i++) {
    const x0 = cx - ((n - 1) * sep) / 2 + i * sep - e / 2;
    pg.drawSvgPath(ESTRELLA, { x: x0, y: cy + r * 0.47, scale: e / 10, color: oscuro });
  }
  const nombre = plan === "gold" ? "GOLD" : "PLATINUM";
  centrado(nombre, -r * 0.1, fb, r * (plan === "gold" ? 0.32 : 0.2), oscuro);
  centrado("VERIFICADA", -r * 0.34, fb, r * 0.12, oscuro);
}

// Sello «Verificado con información del SII» (diseño propio de Nico Pacheco: círculo verde con visto bueno).
function selloSii(pg: PDFPage, cx: number, cy: number, r: number, fb: PDFFont, verde: ReturnType<typeof rgb>) {
  const blanco = rgb(1, 1, 1);
  pg.drawCircle({ x: cx, y: cy, size: r, color: verde });
  pg.drawCircle({ x: cx, y: cy, size: r - 2.5, borderColor: blanco, borderWidth: 0.8 });
  // Dientes alrededor, como un timbre
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2;
    pg.drawCircle({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r, size: 1.6, color: verde });
  }
  // Visto bueno
  const s = r / 10;
  pg.drawSvgPath("M-4.6 0.4 L-1.6 3.4 L4.8 -3.2", { x: cx, y: cy + r * 0.28, scale: s * 0.9, borderColor: blanco, borderWidth: 2.2 });
  const t = "SII", ts = r * 0.42;
  pg.drawText(t, { x: cx - fb.widthOfTextAtSize(t, ts) / 2, y: cy - r * 0.52, size: ts, font: fb, color: blanco });
}
