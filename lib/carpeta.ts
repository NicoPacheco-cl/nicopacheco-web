// Lectura de la carpeta tributaria electrónica del SII (10 oct 2026). Módulo puro: recibe el texto del PDF.
// La carpeta «para solicitar créditos» trae los F29 de los últimos 24 meses. De cada mes se usan:
//   - Ventas netas: código 563 (ingresos brutos del mes, base del PPM). Si no está: 538 ÷ 0,19 + 142 + 020.
//   - Compras netas con IVA: código 537 (total créditos) ÷ 0,19.
// El formato del PDF puede cambiar: si no se logra leer al menos 6 meses, la carpeta queda «en revisión» y el
// dueño del portal ingresa las cifras a mano en /admin.

export type Periodo = { periodo: string; ventas: number; compras: number }; // periodo = "AAAA-MM"
export type Lectura = {
  ok: boolean;
  periodos: Periodo[];          // más reciente primero
  meses: number;                // meses usados para el promedio (máx. 12)
  ventas12: number; compras12: number;
  ventasAnt12: number | null;   // los 12 meses anteriores (si la carpeta trae 24)
  ultimo: string;               // último período leído
  sinDeclaracion: string[];     // meses que la carpeta muestra sin F29 («No se registra declaración»)
  rut: string; razon: string;
  motivo?: string;
};

const MESES: Record<string, number> = {
  enero: 1, ene: 1, febrero: 2, feb: 2, marzo: 3, mar: 3, abril: 4, abr: 4, mayo: 5, may: 5, junio: 6, jun: 6,
  julio: 7, jul: 7, agosto: 8, ago: 8, septiembre: 9, setiembre: 9, sep: 9, sept: 9, set: 9, octubre: 10, oct: 10,
  noviembre: 11, nov: 11, diciembre: 12, dic: 12,
};
const num = (s: string) => Number(s.replace(/\./g, "").replace(/,\d+$/, "")) || 0;
const pp = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

// Busca menciones de período: «2025-09», «09/2025», «09-2025», «202509», «Septiembre 2025», «SEP-2025».
const RE_PERIODO = new RegExp(
  String.raw`\b(?:(20\d{2})[-/](0[1-9]|1[0-2])|(0[1-9]|1[0-2])[-/](20\d{2})|(20\d{2})(0[1-9]|1[0-2])(?!\d)|(${Object.keys(MESES).sort((a, b) => b.length - a.length).join("|")})\.?[\s\-/de]*(20\d{2}))\b`,
  "gi",
);
function periodoDe(m: RegExpExecArray) {
  if (m[1]) return pp(+m[1], +m[2]);
  if (m[3]) return pp(+m[4], +m[3]);
  if (m[5]) return pp(+m[5], +m[6]);
  return pp(+m[8], MESES[m[7].toLowerCase()]);
}

// Valor de un código dentro de un tramo de texto: el primer monto que aparece después del código.
function codigo(texto: string, cod: string) {
  const re = new RegExp(String.raw`(?:^|[^\d.])${cod}(?![\d.])`, "g");
  for (let m; (m = re.exec(texto)); ) {
    // Desde el código, el primer monto antes de 160 caracteres. Si antes aparece otro código (número corto
    // seguido de su glosa en mayúsculas), este código no tiene monto.
    const resto = texto.slice(m.index + m[0].length, m.index + m[0].length + 160);
    const tok = /(\d{1,3}(?:\.\d{3})+|\d+)(?![\d.,%])(\s+[A-ZÁÉÍÓÚÑ]{2,})?/g;
    for (let x; (x = tok.exec(resto)); ) {
      if (x[2] && !x[1].includes(".") && x[1].length <= 4) break;
      return num(x[1]);
    }
  }
  return null;
}

export function leerCarpeta(texto: string): Lectura {
  const t = texto.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const rut = /\b(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])\b/.exec(t)?.[1] ?? "";
  const razon = (/(?:nombre del emisor|nombre o raz[oó]n social|raz[oó]n social|nombre)\s*:?\s*\n?\s*([^\n]{3,120})/i.exec(t)?.[1] ?? "")
    .split(/\s+(?:R\.?U\.?T\.?|Rut|Domicilio|Direcci[oó]n|Giro|Fecha|Per[ií]odo|\d{1,2}\.\d{3}\.\d{3}-)/i)[0].trim().slice(0, 80);

  // Solo la sección de los F29 (la carpeta trae después los F22, con otros códigos).
  const ini = t.search(/formulario\s*29|\bF29\b/i);
  const finF29 = t.slice(Math.max(0, ini)).search(/declaraciones de renta|formulario\s*22|\bF22\b/i);
  const f29 = ini >= 0 ? t.slice(ini, finF29 > 0 ? ini + finF29 : undefined) : t;
  // Tramos: desde cada mención de período hasta la siguiente; se queda con el tramo más largo de cada período.
  const marcas: { periodo: string; i: number }[] = [];
  RE_PERIODO.lastIndex = 0;
  for (let m; (m = RE_PERIODO.exec(f29)); ) marcas.push({ periodo: periodoDe(m), i: m.index });
  const tramos = new Map<string, string>();
  marcas.forEach((x, k) => {
    const fin = k + 1 < marcas.length ? marcas[k + 1].i : Math.min(f29.length, x.i + 3000);
    const tr = f29.slice(x.i, fin);
    if ((tramos.get(x.periodo)?.length ?? 0) < tr.length) tramos.set(x.periodo, tr);
  });

  const periodos: Periodo[] = [];
  const sinDeclaracion: string[] = [];
  for (const [periodo, tr] of tramos) {
    if (/no se registra declaraci[oó]n/i.test(tr)) { sinDeclaracion.push(periodo); continue; }
    const c563 = codigo(tr, "563");
    const c538 = codigo(tr, "538");
    const c537 = codigo(tr, "537");
    const exentas = (codigo(tr, "142") ?? 0) + (codigo(tr, "020") ?? 0);
    const ventas = c563 && c563 > 0 ? c563 : c538 ? Math.round(c538 / 0.19) + exentas : 0;
    const compras = c537 ? Math.round(c537 / 0.19) : 0;
    if (ventas > 0) periodos.push({ periodo, ventas, compras });
  }
  const r = resumen(periodos, rut, razon);
  r.sinDeclaracion = sinDeclaracion.sort().reverse();
  if (!r.ok && sinDeclaracion.length) r.motivo = `La carpeta muestra ${sinDeclaracion.length} meses sin declaración F29${periodos.length ? ` y ${periodos.length} con declaración` : ""}.`;
  return r;
}

// Resumen de 12 meses (y los 12 anteriores) a partir de los períodos leídos o ingresados a mano.
export function resumen(periodos: Periodo[], rut = "", razon = ""): Lectura {
  const ps = [...periodos].filter((p) => /^20\d{2}-(0[1-9]|1[0-2])$/.test(p.periodo)).sort((a, b) => b.periodo.localeCompare(a.periodo));
  const ult = ps.slice(0, 12), ant = ps.slice(12, 24);
  const suma = (xs: Periodo[], k: "ventas" | "compras") => xs.reduce((s, x) => s + x[k], 0);
  const ok = ult.length >= 6;
  return {
    ok, periodos: ps, meses: ult.length,
    ventas12: suma(ult, "ventas"), compras12: suma(ult, "compras"),
    ventasAnt12: ant.length >= 12 ? suma(ant, "ventas") : null,
    ultimo: ps[0]?.periodo ?? "", sinDeclaracion: [], rut, razon,
    motivo: ok ? undefined : ps.length ? `Solo se pudieron leer ${ps.length} meses.` : "No se encontraron declaraciones F29 en el archivo.",
  };
}

// Ingreso manual desde /admin: una línea por mes, «AAAA-MM; ventas; compras».
export function periodosDesdeTexto(x: string): Periodo[] {
  return x.split(/\n+/).map((l) => l.split(/[;\t]/).map((s) => s.trim())).filter((p) => /^20\d{2}-(0[1-9]|1[0-2])$/.test(p[0] ?? ""))
    .map(([periodo, v, c]) => ({ periodo, ventas: num(v ?? ""), compras: num(c ?? "") })).filter((p) => p.ventas > 0);
}

export const NOMBRE_MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const mesTexto = (p: string) => (p ? `${NOMBRE_MES[+p.slice(5, 7) - 1]} ${p.slice(0, 4)}` : "");
