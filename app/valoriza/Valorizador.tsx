"use client";

import { MultiplosEbitda } from "./MultiplosEbitda";
import { useEffect, useMemo, useRef, useState } from "react";

// Arriendo en UF → pesos con el valor de la UF del día (acepta coma decimal).
const arriendoEnPesos = (ufTxt?: string, valorUF?: string) => {
  const u = Number(String(ufTxt ?? "").replace(/\./g, "").replace(",", ".")) || 0;
  const v = Number(valorUF) || 0;
  return u > 0 && v > 0 ? String(Math.round(u * v)) : "";
};
import { REGIONES, RUBROS } from "@/lib/catalogos";
import {
  clp, DIMENSIONES, fmtPts, pctTxt, SISTEMAS, TIPOS_ENTORNO, sinMesasPermitidas, TIPOS_RESOLUCION, valorizar, valorVehiculos, VALORIZACION_VACIA, ventaBruta,
  type DatosValorizacion, type IdDim,
} from "@/lib/valorizacion";
const n0 = (v?: string) => Math.max(0, Number(String(v ?? "").replace(/\D/g, "")) || 0);
import { Campo, Entero, Opciones, Pesos } from "./Campos";
import { Certificado, clave } from "./Certificado";
import { CarpetaSII } from "./CarpetaSII";
import { InventarioDetalle, TotalInventario } from "./InventarioDetalle";
import { detalleManda } from "@/lib/inventario";

// Campo calculado (no editable), con el mismo aspecto que un campo en pesos.
const SoloLectura = ({ v }: { v: string }) => (
  <span className="pf-pesos inv-solo"><span aria-hidden="true">$</span><input readOnly tabIndex={-1} value={v ? Number(v).toLocaleString("es-CL") : "0"} aria-readonly="true" /></span>
);

const GUARDADO = "np-valoriza-v1";
const PASO = "np-valoriza-paso";
const CERT = "np-valoriza-certificado"; // token del último certificado pagado en este navegador
const NIVELES: ["alto" | "regular" | "bajo", string][] = [["alto", "Alto"], ["regular", "Regular"], ["bajo", "Bajo"]];
const SN: ["si" | "no", string][] = [["si", "Sí"], ["no", "No"]];
const PASOS: { id: IdDim | "venta" | "resultado"; t: string }[] = [
  { id: "venta", t: "Qué se vende" }, ...DIMENSIONES.map((x) => ({ id: x.id, t: x.titulo })), { id: "resultado", t: "Resultado" },
];
const f1 = (x: number) => (Math.round(x * 100) / 100).toFixed(2).replace(".", ",");

// `cobro`: con Mercado Pago activo, el valor se ve en la etapa 1 (estimación inicial) y se nubla desde la etapa 2
// hasta pagar el certificado. Sin cobro (lanzamiento) todo se ve.
export function Valorizador({ cobro = false }: { cobro?: boolean }) {
  const [d, setD] = useState<DatosValorizacion>(VALORIZACION_VACIA);
  const [uf, setUf] = useState<{ valor: number; fecha: string | null }>({ valor: 40000, fecha: null });
  useEffect(() => {
    fetch("/api/uf").then((r) => r.json()).then((x) => {
      if (!(Number(x?.valor) > 10000)) return;
      setUf({ valor: Number(x.valor), fecha: x.fecha ?? null });
      // Con el valor del día, actualiza el arriendo en pesos de quien lo ingresó en UF.
      setD((y) => (y.arriendoMoneda === "uf" ? { ...y, valorUF: String(x.valor), arriendo: arriendoEnPesos(y.arriendoUF, String(x.valor)) } : y));
    }).catch(() => {});
  }, []);
  const [paso, setPaso] = useState(0);
  const [listo, setListo] = useState(false);
  const [pagado, setPagado] = useState<{ token: string; clave: string } | null>(null);
  const tope = useRef<HTMLDivElement>(null);
  const etapas = useRef<HTMLElement>(null);

  // En el celular, la etapa actual queda visible en la fila de etapas (que se desliza de lado).
  useEffect(() => {
    const nav = etapas.current, b = nav?.querySelector<HTMLElement>("button.on");
    if (!nav || !b || nav.scrollWidth <= nav.clientWidth) return;
    const rn = nav.getBoundingClientRect(), rb = b.getBoundingClientRect();
    nav.scrollLeft += rb.left - rn.left - (rn.width - rb.width) / 2;
  }, [paso, listo]);

  // Certificado pagado: llega con ?certificado=<token> (desde su página) o queda guardado en el navegador.
  useEffect(() => {
    let token = new URLSearchParams(window.location.search).get("certificado") ?? "";
    const desdeEnlace = Boolean(token);
    try { if (!token) token = localStorage.getItem(CERT) ?? ""; } catch { /* nada */ }
    if (!/^[0-9a-f-]{36}$/.test(token)) return;
    fetch(`/api/certificado/estado?t=${token}`)
      .then((r) => r.json())
      .then((x: { disponible?: boolean; datos?: DatosValorizacion }) => {
        if (!x.disponible || !x.datos) return;
        const datos = { ...VALORIZACION_VACIA, ...x.datos };
        setPagado({ token, clave: clave(datos) });
        if (desdeEnlace) { setD(datos); setPaso(PASOS.length - 1); }
        try { localStorage.setItem(CERT, token); } catch { /* nada */ }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const g = localStorage.getItem(GUARDADO);
      if (g) {
        const x = { ...VALORIZACION_VACIA, ...JSON.parse(g) } as DatosValorizacion;
        // Datos guardados antes del 6 oct 2026 traen la venta bruta: se pasan a neta.
        if (!x.ventaNeta && x.ventaMensual) { x.ventaNeta = String(Math.round(Number(x.ventaMensual) / 1.19)); x.ventaMensual = ""; }
        setD(x);
      }
      const p = Number(localStorage.getItem(PASO));
      if (p > 0 && p < PASOS.length) setPaso(p);
    } catch { /* sin almacenamiento */ }
    setListo(true);
  }, []);
  useEffect(() => {
    if (!listo) return;
    try { localStorage.setItem(GUARDADO, JSON.stringify(d)); localStorage.setItem(PASO, String(paso)); } catch { /* nada */ }
  }, [d, paso, listo]);

  const r = useMemo(() => valorizar(d), [d]);
  const manda = detalleManda(d.inventarioDetalle);

  const pagadoEstos = pagado !== null && pagado.clave === clave(d);
  const ver = !cobro || pagadoEstos;                 // valor final y detalle
  const verInicial = ver || paso <= 1;              // estimación de la etapa 1
  const { razonSocial: RS, cuenta: CTA, trabajadores: TRAB, marca: MARCA, redes: REDES } = r.alcance;
  const set = <K extends keyof DatosValorizacion>(k: K) => (v: DatosValorizacion[K]) => setD((x) => ({ ...x, [k]: v }));
  const ir = (p: number) => {
    setPaso(Math.max(0, Math.min(PASOS.length - 1, p)));
    requestAnimationFrame(() => tope.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const actual = PASOS[paso];
  const dim = r.dimensiones.find((x) => x.id === actual.id);
  const sistemas = d.sistemas.split(",").filter(Boolean);
  const toggleSistema = (k: string) => set("sistemas")((sistemas.includes(k) ? sistemas.filter((x) => x !== k) : [...sistemas, k]).join(","));

  // Pregunta de deuda de cada dimensión: ¿hay deuda con el acreedor de esta dimensión? ¿cuánto?
  const Deuda = ({ si, monto, acreedor, ayuda }: { si: "deudaArriendo" | "deudaEquipos" | "deudaPermisos" | "deudaFinanciera" | "deudaLaboral" | "deudaTributaria" | "deudaSistemas"; monto: keyof DatosValorizacion; acreedor: string; ayuda?: string }) => (
    <div className="va-deuda-q">
      <Opciones label={`¿Hay deuda ${acreedor}?`} value={d[si]} onChange={set(si)} opciones={SN}
        ayuda="Si hay, baja el puntaje de esta etapa y el monto se descuenta completo del valor." />
      {d[si] === "si" && (
        <Campo label="Monto total adeudado" ayuda={ayuda}>
          <Pesos value={String(d[monto] ?? "")} onChange={(v) => setD((x) => ({ ...x, [monto]: v }))} placeholder="1.500.000" />
        </Campo>
      )}
    </div>
  );

  function imprimir() {
    fetch("/api/valorizacion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).catch(() => {});
    window.print();
  }

  const valorPanel = (() => {
    if (!r.listoInicial) return { etiqueta: "Valor estimado", valor: "$ —", nota: "Completa la venta y la utilidad de la etapa 1 para ver una primera estimación.", nublado: false };
    if (paso <= 1 && !ver) return { etiqueta: "Estimación inicial", valor: clp(r.estimacionInicial), nota: r.sueldoReemplazo > 0
      ? `Utilidad ${clp(r.utilidad)} − sueldo de administrador ${clp(r.sueldoReemplazo)} = ${clp(r.utilidadNormalizada)} al mes, × 12 × ${f1(r.multiplo)} veces (múltiplo de tu rubro). Las próximas etapas la ajustan según la calidad del negocio.`
      : `Solo con tu utilidad × ${f1(r.multiplo)} veces (múltiplo de tu rubro). Las próximas etapas la ajustan según la calidad del negocio.`, nublado: false };
    if (!ver) return { etiqueta: "Valor ajustado", valor: "$00.000.000", nota: "El valor se ajusta con cada etapa. Al final, desbloquéalo con tu certificado de valorización.", nublado: true };
    if (!r.listo) return { etiqueta: "Estimación inicial", valor: clp(r.estimacionInicial), nota: `${r.sueldoReemplazo > 0 ? `Utilidad ${clp(r.utilidad)} − sueldo de administrador ${clp(r.sueldoReemplazo)} = ${clp(r.utilidadNormalizada)} al mes. ` : ""}Completa el arriendo (etapa 2) para calcular el valor final.`, nublado: false };
    return { etiqueta: "Valor del derecho de llave", valor: clp(r.valor), nota: `Recuperas la inversión en ${r.mesesRecupero.toFixed(1).replace(".", ",")} meses de utilidad${d.m2 ? `, ${d.m2} m²` : ""}.`, nublado: false };
  })();

  return (
    <div className="va va4" ref={tope}>

      {/* Celular: en vez de los cuadritos de etapas, una línea de avance */}
      <div className="va-progreso" aria-hidden="true">
        <div><b>{actual.id === "resultado" ? "Resultado" : actual.id === "venta" ? "Antes de empezar" : `Etapa ${paso} de ${PASOS.length - 2}`}</b><span>{fmtPts(r.puntaje)} / 100 pts</span></div>
        <span className="pf-barra"><i style={{ width: `${(paso / (PASOS.length - 1)) * 100}%` }} /></span>
      </div>

      <div className="va-form">
        <section className="va-sec">
          <div className="va-cab">
            <span className="eyebrow">{actual.id === "resultado" ? "Resultado" : actual.id === "venta" ? "Antes de empezar" : `Etapa ${paso} de ${PASOS.length - 2}`}</span>
            <h2>{actual.id === "resultado" ? "Tu valorización" : actual.id === "venta" ? "¿Qué incluye la venta?" : actual.t}</h2>
            {dim && (
              <>
                <div className="va-pts"><span className="pf-barra"><i style={{ width: `${(dim.puntos / dim.max) * 100}%` }} /></span><span>{fmtPts(dim.puntos)} de {fmtPts(dim.max)} puntos</span></div>
                <details className="va-porque"><summary>¿Por qué esta etapa vale {fmtPts(dim.max)} puntos?</summary><p>{dim.porQue}</p></details>
              </>
            )}
          </div>

          {actual.id === "venta" && (
            <>
              <p className="pf-ayuda">
                Estas respuestas definen qué preguntas aparecen: no se valoriza lo que el comprador no se lleva. El puntaje se
                calcula sobre las preguntas que aplican a tu caso.
              </p>
              <div className="pf-grid">
                <Opciones label="¿El derecho de llave incluye la razón social (la empresa)?" value={d.conRazonSocial} onChange={set("conRazonSocial")} opciones={SN}
                  ayuda="Sí: el comprador compra la sociedad y sigue con sus permisos, contrato y cuentas. No: compra solo el negocio y lo opera con su propia empresa." />
                {d.conRazonSocial === "si" ? (
                  <Opciones label="¿Incluye la cuenta corriente de la empresa?" value={d.conCuenta} onChange={set("conCuenta")} opciones={SN}
                    ayuda="Con su historial, línea de crédito y tarjeta." />
                ) : d.conRazonSocial === "no" ? (
                  <Opciones label="¿Los trabajadores siguen con el comprador?" value={d.trabajadoresPasan} onChange={set("trabajadoresPasan")}
                    opciones={[["si", "Sí, siguen"], ["no", "No, el vendedor los finiquita"]]}
                    ayuda="Si siguen, el comprador hereda su antigüedad e indemnizaciones (Código del Trabajo, art. 4)." />
                ) : <span className="pf-hueco" />}
                <Opciones label="¿Incluye la marca o nombre comercial?" value={d.conMarca} onChange={set("conMarca")} opciones={SN}
                  ayuda="Si no se vende, el comprador tendrá que partir con un nombre nuevo." />
                {d.conMarca === "si" && (
                  <Opciones label="¿Incluye las cuentas de redes sociales?" value={d.conRedes} onChange={set("conRedes")} opciones={SN}
                    ayuda="Instagram, Facebook, TikTok y la ficha de Google del negocio." />
                )}
              </div>
              {d.conRazonSocial === "si" && (
                <p className="va-aviso">
                  <strong>Vender la empresa es la forma más rápida de traspasar el negocio:</strong> solo se cambian los estatutos, sin
                  transferir patente, resolución sanitaria ni contrato. Por eso se revisan con cuidado sus deudas, su cuenta corriente y
                  su situación tributaria, y una sociedad sin deudas suma puntos.
                </p>
              )}
              {d.conRazonSocial === "no" && (
                <p className="va-aviso">
                  Aunque no se venda la empresa, quien compra un establecimiento queda como fiador de los impuestos del vendedor (Código
                  Tributario, art. 71): por eso se pregunta igual por los impuestos, y si hay deuda tributaria se descuenta completa.
                </p>
              )}
            </>
          )}

          {actual.id === "negocio" && (
            <>
            <div className="pf-grid">
              <Campo label="Rubro">
                <select value={d.rubro} onChange={(e) => set("rubro")(e.target.value)}>
                  <option value="">Elige una opción</option>
                  {RUBROS.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Campo>
              <Campo label="Región">
                <select value={d.region} onChange={(e) => set("region")(e.target.value)}>
                  <option value="">Elige una región</option>
                  {REGIONES.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Campo>
              <Campo label="Comuna"><input maxLength={60} value={d.comuna} onChange={(e) => set("comuna")(e.target.value)} placeholder="Puerto Montt" /></Campo>
              <Campo label="Años funcionando"><Entero value={d.anosFuncionando} onChange={set("anosFuncionando")} sufijo="años" placeholder="5" /></Campo>
              <Campo label="Venta neta mensual promedio" ayuda="Sin IVA, promedio de los últimos 12 meses">
                <Pesos value={d.ventaNeta ?? ""} onChange={(v) => setD((x) => ({ ...x, ventaNeta: v, ventaMensual: "" }))} placeholder="10.000.000" />
              </Campo>
              <Campo label="Venta neta mensual de hace 12 meses" ayuda="Para medir el crecimiento (opcional)">
                <Pesos value={d.ventaNetaAnterior ?? ""} onChange={(v) => setD((x) => ({ ...x, ventaNetaAnterior: v }))} placeholder="9.000.000" />
              </Campo>
              <Campo label="Utilidad mensual promedio (EBITDA)" ayuda="Lo que queda después de pagar todos los gastos, antes de impuestos">
                <Pesos value={d.utilidadMensual} onChange={set("utilidadMensual")} placeholder="1.500.000" />
              </Campo>
              <Campo label="¿Con cuántas personas funciona el negocio?" ayuda="Todos los que trabajan, incluido el dueño si trabaja ahí. Con menos personas para la misma venta, más puntaje."><Entero value={d.trabajadores} onChange={set("trabajadores")} sufijo="personas" placeholder="4" /></Campo>
              <Opciones label="¿El negocio funciona sin el dueño?" value={d.dependenciaDueno} onChange={set("dependenciaDueno")}
                opciones={[["baja", "Sí, con un administrador"], ["media", "El dueño trabaja parte del día"], ["alta", "Depende totalmente del dueño"]]} />
              {/* 24 oct 2026, pedido de Nico: primero el sueldo de un administrador del rubro y después si ya está descontado. */}
              <Campo label="¿Cuál es el sueldo de un administrador para tu rubro?" ayuda="Sueldo mensual con cotizaciones, lo que costaría contratar a alguien que haga el trabajo del dueño.">
                <Pesos value={d.sueldoReemplazo} onChange={set("sueldoReemplazo")} placeholder="900.000" />
              </Campo>
              <Opciones label="¿Este sueldo ya está descontado de la utilidad?" value={d.utilidadConSueldo} onChange={set("utilidadConSueldo")} opciones={SN}
                ayuda={d.utilidadConSueldo === "no" && n0(d.sueldoReemplazo) > 0
                  ? `Se restan ${clp(n0(d.sueldoReemplazo))} a tu utilidad: el comprador tendrá que pagar ese sueldo o trabajar él.`
                  : "Si ya pagas un administrador, la respuesta es «Sí». Si el dueño trabaja sin sueldo, «No»: ese sueldo se resta de la utilidad."} />
            </div>
            <CarpetaSII d={d} cambiar={(x) => setD((y) => ({ ...y, ...x }))} />
            </>
          )}

          {actual.id === "arriendo" && (
            <div className="pf-grid">
              <div className="va-moneda">
                <div className="va-moneda-sel" role="group" aria-label="Moneda del arriendo">
                  <span className="pf-label">El arriendo está en</span>
                  <button type="button" className={d.arriendoMoneda !== "uf" ? "on" : ""} onClick={() => setD((x) => ({ ...x, arriendoMoneda: "clp" }))}>Pesos</button>
                  <button type="button" className={d.arriendoMoneda === "uf" ? "on" : ""} onClick={() => setD((x) => ({ ...x, arriendoMoneda: "uf", valorUF: x.valorUF || String(uf.valor), arriendo: arriendoEnPesos(x.arriendoUF, x.valorUF || String(uf.valor)) }))}>UF</button>
                </div>
                {d.arriendoMoneda === "uf" ? (
                  <Campo label="Valor mensual del arriendo en UF">
                    <span className="pf-pesos">
                      <input inputMode="decimal" value={d.arriendoUF ?? ""} placeholder="25"
                        onChange={(e) => { const v = e.target.value.replace(/[^\d,.]/g, "").slice(0, 9); setD((x) => ({ ...x, arriendoUF: v, arriendo: arriendoEnPesos(v, x.valorUF || String(uf.valor)) })); }} />
                      <span aria-hidden="true">UF</span>
                    </span>
                  </Campo>
                ) : (
                  <Campo label="Valor mensual del arriendo"><Pesos value={d.arriendo} onChange={set("arriendo")} placeholder="800.000" /></Campo>
                )}
                {d.arriendoMoneda === "uf" && (
                  <Campo label="Valor de la UF" ayuda={uf.fecha ? "Valor del día; puedes corregirlo" : "No pudimos traer el valor del día: revísalo en sii.cl y corrígelo"}>
                    <Pesos value={String(Math.round(Number(d.valorUF || uf.valor)))} onChange={(v) => setD((x) => ({ ...x, valorUF: v, arriendo: arriendoEnPesos(x.arriendoUF, v) }))} placeholder="40.000" />
                  </Campo>
                )}
                {d.arriendoMoneda === "uf" && (
                  <p className="pf-ayuda">
                    UF a {"$" + Number(d.valorUF || uf.valor).toLocaleString("es-CL", { maximumFractionDigits: 2 })}{uf.fecha ? ` (valor del ${new Date(uf.fecha).toLocaleDateString("es-CL")})` : " (valor aproximado)"} ={" "}
                    <strong>{d.arriendo ? "$" + Number(d.arriendo).toLocaleString("es-CL") : "$ —"}</strong> al mes.
                  </p>
                )}
              </div>
              <Campo label="Gasto común mensual" ayuda="Déjalo en blanco si el local no paga gasto común"><Pesos value={d.gastoComun ?? ""} onChange={set("gastoComun")} placeholder="0" /></Campo>
              <Opciones label="¿Hay otros cobros en la renta?" value={d.otrosCobros ?? ""} onChange={set("otrosCobros")} opciones={SN}
                ayuda="Ej.: fondo de promoción del mall, porcentaje sobre ventas, contribuciones o seguros que cobra el arrendador" />
              {d.otrosCobros === "si" && (
                <>
                  <Campo label="Monto mensual de los otros cobros"><Pesos value={d.otrosCobrosMonto ?? ""} onChange={set("otrosCobrosMonto")} placeholder="150.000" /></Campo>
                  <Campo label="¿Qué cobros son?"><input value={d.otrosCobrosDetalle ?? ""} maxLength={120} onChange={(e) => setD((x) => ({ ...x, otrosCobrosDetalle: e.target.value }))} placeholder="Fondo de promoción y contribuciones" /></Campo>
                </>
              )}
              <Campo label="Meses que quedan de contrato" ayuda="Ej.: contrato de 3 años con 2 operados = 12 meses"><Entero value={d.mesesRestantes} onChange={set("mesesRestantes")} sufijo="meses" placeholder="36" /></Campo>
              {d.mesesRestantes && (
                <p className="va-sugerencia va-ancho">
                  💡 <b>El contrato pone el techo al precio:</b> el comprador debe recuperar lo que paga en el 40% de los meses que le quedan
                  (50% con la valorización Gold o Platinum verificada).
                  {r.utilidadNormalizada > 0 && <> Hoy el máximo es {clp(r.topeContrato)}. <b>Si firmas un anexo que alargue el contrato, la valorización sube considerablemente:</b> cada 12 meses más suman hasta {clp(r.utilidadNormalizada * 12 * r.pctTope)}.</>}
                </p>
              )}
              <Opciones label="¿El contrato tiene renovación o opción de renovar, por escrito?" value={d.renovacion} onChange={set("renovacion")} opciones={SN} ayuda="Con renovación por escrito se cuentan 12 meses más para el máximo que se puede pedir." />
              {RS ? (
                <p className="pf-ayuda">El contrato está a nombre de la empresa que se vende: no hay que cederlo.</p>
              ) : (
                <Opciones label="¿El arrendador autoriza ceder el contrato al comprador?" value={d.autorizaCesion} onChange={set("autorizaCesion")}
                  opciones={[["si", "Sí, por escrito"], ["conversacion", "En conversación"], ["no", "No"]]} />
              )}
              <Opciones label="¿El contrato está firmado ante notario?" value={d.contratoNotarial} onChange={set("contratoNotarial")} opciones={SN} />
              <Opciones label="¿El arrendador puede terminar el contrato antes, sin causa (con solo avisar)?" value={d.terminoAnticipado ?? ""} onChange={set("terminoAnticipado")} opciones={SN}
                ayuda="Búscalo en la cláusula de término. En Gold y Platinum se revisa con el contrato." />
              <span className="pf-hueco" />
              <Deuda si="deudaArriendo" monto="deudaArriendoMonto" acreedor="con el arrendador" ayuda="Rentas, gastos comunes o servicios básicos impagos" />
            </div>
          )}

          {actual.id === "equipos" && (
            <div className="pf-grid">
              <TotalInventario d={d} />
              <Campo label="Valor neto de los equipos como nuevos" ayuda={manda.equipos ? "Suma del detalle del inventario (abajo), sin IVA" : "Lo que costaría comprarlos hoy, sin IVA. O detállalos abajo y se calcula solo."}>
                {manda.equipos ? <SoloLectura v={d.inventarioNuevo} /> : <Pesos value={d.inventarioNuevo} onChange={set("inventarioNuevo")} placeholder="30.000.000" />}
              </Campo>
              <Campo label="Años de uso de los equipos"><Entero value={d.anosUso} onChange={set("anosUso")} sufijo="años" placeholder="3" /></Campo>
              <Campo label="Mercadería en bodega (a precio de costo)" ayuda="Se suma al valor, como se negocia en Chile"><Pesos value={d.mercaderia} onChange={set("mercaderia")} placeholder="2.000.000" /></Campo>
              <Opciones label="¿La venta incluye vehículos?" value={d.vehiculos ?? ""} onChange={set("vehiculos")} opciones={SN} ayuda="Camioneta de reparto, carro, food truck, moto…" />
              {d.vehiculos === "si" && (
                <>
                  <Campo label="¿Cuánto cuestan los vehículos nuevos hoy?" ayuda={manda.vehiculos ? "Suma de los vehículos del detalle del inventario (abajo)" : "El precio de lista del mismo modelo nuevo. Si son varios, súmalos."}>
                    {manda.vehiculos ? <SoloLectura v={d.vehiculosNuevo ?? ""} /> : <Pesos value={d.vehiculosNuevo ?? ""} onChange={set("vehiculosNuevo")} placeholder="20.000.000" />}
                  </Campo>
                  <Campo label="Años de uso de los vehículos" ayuda={valorVehiculos(d) ? `Valor hoy: ${clp(valorVehiculos(d))} (−8% por año desde el primero, mínimo 20% del precio nuevo)` : "Pierden 8% por año (recién comprado cuenta como 1 año), hasta quedar en 20% del precio nuevo a los 10 años."}><Entero value={d.vehiculosAnos ?? ""} onChange={set("vehiculosAnos")} sufijo="años" placeholder="5" /></Campo>
                  <Opciones label="¿Tienen papeles al día y están sin prenda?" value={d.vehiculosAlDia ?? ""} onChange={set("vehiculosAlDia")} opciones={SN} ayuda="Permiso de circulación, revisión técnica y SOAP vigentes; sin crédito pendiente." />
                </>
              )}
              <InventarioDetalle d={d} cambiar={(x) => setD((y) => ({ ...y, ...x }))} />
              <Opciones label="¿Los equipos son propios y tienen facturas?" value={d.equiposFacturas} onChange={set("equiposFacturas")} opciones={SN} ayuda="No cuentan los equipos en comodato de proveedores." />
              <Opciones label="¿Las mantenciones están al día?" value={d.mantenciones} onChange={set("mantenciones")} opciones={SN} />
              <Deuda si="deudaEquipos" monto="deudaEquiposMonto" acreedor="por los equipos o vehículos" ayuda="Leasing, créditos, prendas o cuotas pendientes (también de los vehículos)" />
            </div>
          )}

          {actual.id === "ubicacion" && (
            <div className="pf-grid">
              <Opciones label="Flujo peatonal" value={d.peatonal} onChange={set("peatonal")} opciones={NIVELES} />
              <Opciones label="Flujo vehicular" value={d.vehicular} onChange={set("vehicular")} opciones={NIVELES} />
            </div>
          )}

          {actual.id === "entorno" && (
            <>
              <div className="pf-grid">
                <Opciones label="¿Dónde está el local?" value={d.entornoTipo} onChange={set("entornoTipo")} opciones={TIPOS_ENTORNO} />
                <Opciones label={d.entornoTipo === "calle" || !d.entornoTipo ? "¿Hay una tienda ancla a menos de 100 metros?" : "¿El centro comercial tiene una tienda ancla?"}
                  value={d.tiendaAncla} onChange={set("tiendaAncla")} opciones={SN}
                  ayuda="Una tienda grande que atrae público por sí sola: supermercado, farmacia o tienda de cadena, banco, clínica, universidad. Suma valor; si no hay, no resta." />
                {d.tiendaAncla === "si" && (
                  <Campo label="¿Cuál es la tienda ancla?">
                    <input value={d.tiendaAnclaNombre} maxLength={60} onChange={(e) => set("tiendaAnclaNombre")(e.target.value)} placeholder="Ej.: Unimarc, Cruz Verde, Lider" />
                  </Campo>
                )}
                <Opciones label="¿Cómo son las ventas durante el año?" value={d.estacionalidad} onChange={set("estacionalidad")}
                  opciones={[["pareja", "Parejas todo el año"], ["temporada", "Suben en una temporada, pero vende todo el año"], ["alta", "Dependen de una temporada (por ejemplo, solo verano)"]]}
                  ayuda="La utilidad que escribiste en la etapa 1 debe ser el promedio de los 12 meses, no la de los meses buenos." />
                <Opciones label="Competidores directos a menos de 500 metros" value={d.competencia} onChange={set("competencia")}
                  opciones={[["ninguna", "Ninguno"], ["poca", "1 o 2"], ["mucha", "3 o más"]]}
                  ayuda="Negocios que venden lo mismo, a unas 5 cuadras a la redonda." />
              </div>
              {r.entorno.lineas.length > 0 && (
                <div className="va-entorno">
                  <strong>Efecto del entorno en el valor: {pctTxt(r.entorno.pct)}</strong>
                  <ul>{r.entorno.lineas.map((x) => <li key={x.t}><span>{x.t}</span><b className={x.pct < 0 ? "neg" : undefined}>{pctTxt(x.pct)}</b></li>)}</ul>
                </div>
              )}
            </>
          )}

          {actual.id === "local" && (
            <div className="pf-grid">
              <Opciones label="Estado de la infraestructura" value={d.infraestructura} onChange={set("infraestructura")}
                opciones={[["nuevo", "Como nuevo"], ["bueno", "Usado, buen estado"], ["mantencion", "Requiere mantención"]]} />
              <span className="pf-hueco" />
              <Campo label="Superficie del local"><Entero value={d.m2 ?? ""} onChange={set("m2")} sufijo="m²" placeholder="38" /></Campo>
              <span className="pf-hueco" />
              <Campo label="Estacionamientos exclusivos del negocio"><Entero value={d.estacionamientos} onChange={set("estacionamientos")} placeholder="0" /></Campo>
              {d.entornoTipo !== "strip" && d.entornoTipo !== "mall" && (
                <Opciones label="¿Está en un strip center con más de 10 estacionamientos?" value={d.stripCenter} onChange={set("stripCenter")} opciones={SN} />
              )}
            </div>
          )}

          {actual.id === "permisos" && (
            <>
              <div className="pf-grid">
                <Opciones label="Patente municipal" value={d.patente} onChange={set("patente")} opciones={[["definitiva", "Definitiva"], ["provisoria", "Provisoria"], ["no", "No tiene"]]} />
                {d.patente && d.patente !== "no" && (
                  <Opciones label="¿Es patente de Microempresa Familiar (MEF)?" value={d.mef} onChange={set("mef")} opciones={SN} ayuda="Funciona en la casa donde vive la familia." />
                )}
                {d.patente && d.patente !== "no" && (
                  <Opciones label="¿El giro de la patente cubre todo lo que vende el negocio?" value={d.patenteGiro ?? ""} onChange={set("patenteGiro")} opciones={SN}
                    ayuda="Ej.: una patente de cafetería no cubre la venta de almuerzos. Se revisa con la patente." />
                )}
                {d.mef === "si" && d.patente !== "no" && (
                  <>
                    <Opciones label="¿El comprador podría vivir en la casa?" value={d.mefViveAhi} onChange={set("mefViveAhi")} opciones={SN} ayuda="«No» si el local ocupa toda la casa o más de la mitad." />
                    <Opciones label="¿Tiene más de 5 trabajadores externos o más de 1.000 UF en equipos?" value={d.mefExcede} onChange={set("mefExcede")} opciones={SN} />
                  </>
                )}
              </div>
              <fieldset className="va-sub">
                <legend>Resolución sanitaria</legend>
                <div className="pf-opciones va-tipos">
                  {TIPOS_RESOLUCION.map(([k, t, ay]) => (
                    <button key={k} type="button" className={d.tipoResolucion === k ? "on" : undefined} aria-pressed={d.tipoResolucion === k}
                      onClick={() => setD((x) => ({ ...x, tipoResolucion: k, sanitaria: k === "no" ? "no" : "si" }))}>
                      <strong>{t}</strong>{ay && <small>{ay}</small>}
                    </button>
                  ))}
                </div>
                {sinMesasPermitidas(d.tipoResolucion) && (
                  <div className="pf-grid">
                    <Opciones label="¿Atiende con mesas o consumo en el local?" value={d.mesas} onChange={set("mesas")} opciones={SN} ayuda="Esta resolución solo permite venta para llevar o en barra." />
                    {d.mesas === "si" && <Opciones label="¿Se puede regularizar como local con consumo?" value={d.regularizable} onChange={set("regularizable")} opciones={SN} ayuda="Tiene o puede habilitar baño para el público." />}
                  </div>
                )}
              </fieldset>
              <fieldset className="va-sub">
                <legend>Patente de alcoholes</legend>
                <div className="pf-grid">
                  <Opciones label="¿Tiene patente de alcoholes?" value={d.alcohol} onChange={set("alcohol")}
                    opciones={[["c", "Restaurante (C)"], ["limitada", "Limitada (botillería, bar, cerveza o minimercado)"], ["ninguna", "No tiene"]]} />
                  {d.alcohol === "c" && <Opciones label="¿Vende alcohol sin comida, como un bar?" value={d.alcoholSinComida} onChange={set("alcoholSinComida")} opciones={SN} />}
                  {d.alcohol === "ninguna" && <Opciones label="¿Vende alcohol igual?" value={d.vendeAlcohol} onChange={set("vendeAlcohol")} opciones={SN} />}
                  {d.alcohol === "ninguna" && d.vendeAlcohol === "si" && (
                    <Campo label="¿Qué parte de la venta es alcohol?" ayuda="Esa venta no se cuenta en el valor"><Entero value={d.pctAlcohol} onChange={(v) => set("pctAlcohol")(v.slice(0, 3))} sufijo="%" placeholder="15" /></Campo>
                  )}
                </div>
              </fieldset>
              <div className="pf-grid"><Deuda si="deudaPermisos" monto="deudaPermisosMonto" acreedor="por patentes, derechos municipales o multas" ayuda="Patentes impagas, derechos de aseo, multas municipales o sanitarias" /></div>
            </>
          )}

          {actual.id === "financiero" && (
            <>
            <CarpetaSII d={d} cambiar={(x) => setD((y) => ({ ...y, ...x }))} compacto />
            <div className="pf-grid">
              <Opciones label="¿Tiene estados de resultados mensuales de los últimos 12 meses?" value={d.eerr} onChange={set("eerr")} opciones={[["si", "Sí"], ["parcial", "Algunos meses"], ["no", "No"]]} />
              <Opciones label="¿Lleva un flujo de caja?" value={d.flujoCaja} onChange={set("flujoCaja")} opciones={SN} ayuda="Entradas y salidas de dinero por semana o mes." />
              <Opciones label="¿Hace conciliación bancaria cada mes?" value={d.conciliacion} onChange={set("conciliacion")} opciones={SN} ayuda="Cuadrar la cartola del banco con ventas y gastos." />
              <Campo label="¿Qué parte de la venta tiene respaldo?" ayuda="Con boleta, factura o pago con tarjeta"><Entero value={d.pctRespaldo} onChange={(v) => set("pctRespaldo")(v.slice(0, 3))} sufijo="%" placeholder="90" /></Campo>
              <Opciones label="¿El negocio o su dueño tienen morosidades o protestos en Dicom?" value={d.morosidades ?? ""} onChange={set("morosidades")} opciones={SN}
                ayuda="Informe comercial de Equifax. En Platinum se revisa con el informe." />
              {TRAB && <Opciones label="¿Remuneraciones y cotizaciones al día, con libro de remuneraciones?" value={d.remuneracionesAlDia} onChange={set("remuneracionesAlDia")} opciones={SN} />}
              {CTA && (
                <fieldset className="va-sub va-ancho">
                  <legend>Cuenta corriente que se traspasa</legend>
                  <div className="pf-grid">
                    <Opciones label="¿Tiene línea de crédito?" value={d.lineaCredito} onChange={set("lineaCredito")} opciones={SN} ayuda="Una línea aprobada le ahorra al comprador conseguir crédito." />
                    {d.lineaCredito === "si" ? (
                      <>
                        <Campo label="Cupo total de la línea"><Pesos value={d.lineaCupo} onChange={set("lineaCupo")} placeholder="5.000.000" /></Campo>
                        <Campo label="¿Cuánto está usado hoy?" ayuda="Lo usado es deuda: se descuenta del valor"><Pesos value={d.lineaUsado} onChange={set("lineaUsado")} placeholder="0" /></Campo>
                        <span className="pf-hueco" />
                      </>
                    ) : <span className="pf-hueco" />}
                    <Opciones label="¿Tiene tarjeta de crédito de la empresa?" value={d.tarjetaCredito} onChange={set("tarjetaCredito")} opciones={SN} />
                    {d.tarjetaCredito === "si" ? (
                      <>
                        <Campo label="Cupo total de la tarjeta"><Pesos value={d.tarjetaCupo} onChange={set("tarjetaCupo")} placeholder="3.000.000" /></Campo>
                        <Campo label="¿Cuánto está usado hoy?" ayuda="Lo usado es deuda: se descuenta del valor"><Pesos value={d.tarjetaUsado} onChange={set("tarjetaUsado")} placeholder="0" /></Campo>
                        <span className="pf-hueco" />
                      </>
                    ) : <span className="pf-hueco" />}
                    <Campo label="Saldo a favor en la cuenta hoy" ayuda="No es parte del valor del negocio: se suma al precio solo si queda en la cuenta al cerrar la venta">
                      <Pesos value={d.saldoCuenta} onChange={set("saldoCuenta")} placeholder="0" />
                    </Campo>
                  </div>
                </fieldset>
              )}
              {RS && <Deuda si="deudaFinanciera" monto="deudaFinancieraMonto" acreedor="de la empresa con bancos o proveedores" ayuda="Créditos, leasing o facturas de proveedores vencidas (sin contar la línea ni la tarjeta)" />}
              {TRAB && <Deuda si="deudaLaboral" monto="deudaLaboralMonto" acreedor="con trabajadores o instituciones previsionales" ayuda="Sueldos, cotizaciones (AFP, salud, cesantía), vacaciones o finiquitos" />}
            </div>
            </>
          )}

          {actual.id === "tributario" && (
            <div className="pf-grid">
              <Opciones label="¿Las declaraciones mensuales (F29) están al día?" value={d.f29AlDia} onChange={set("f29AlDia")} opciones={SN} />
              {RS && (
                <>
                  <Opciones label="¿Tiene contador?" value={d.contador} onChange={set("contador")} opciones={[["externo", "Externo"], ["interno", "Interno"], ["no", "No tiene"]]} />
                  <Opciones label="¿Tiene balance del último año?" value={d.balance} onChange={set("balance")} opciones={SN} />
                  <Opciones label="¿Tiene pre-balance o balance tributario del año en curso?" value={d.preBalance} onChange={set("preBalance")} opciones={SN} />
                </>
              )}
              <Opciones label="¿Puede entregar la carpeta tributaria del SII?" value={d.carpetaTributaria} onChange={set("carpetaTributaria")} opciones={SN} />
              <Opciones label="¿El certificado de deuda de la Tesorería sale sin deudas?" value={d.certificadoTgr} onChange={set("certificadoTgr")} opciones={SN} ayuda="Se obtiene gratis en tgr.cl" />
              <Deuda si="deudaTributaria" monto="deudaTributariaMonto" acreedor="de impuestos con el SII o la Tesorería" ayuda={RS ? "IVA, impuestos, multas o convenios de pago" : "Aunque no se venda la empresa, el comprador responde por estos impuestos (Código Tributario, art. 71): se descuentan completos"} />
            </div>
          )}

          {actual.id === "sistemas" && (
            <>
              <p className="pf-ayuda">Marca lo que usa hoy el negocio.</p>
              <div className="va-checks">
                {SISTEMAS.map(([k, t, p]) => (
                  <label key={k} className={sistemas.includes(k) ? "on" : undefined}>
                    <input type="checkbox" checked={sistemas.includes(k)} onChange={() => toggleSistema(k)} />
                    <span>{t}</span><small>{String(p).replace(".", ",")} pts</small>
                  </label>
                ))}
              </div>
              <div className="pf-grid"><Deuda si="deudaSistemas" monto="deudaSistemasMonto" acreedor="por sistemas o software" ayuda="Licencias, suscripciones o arriendo de equipos de venta impagos" /></div>
            </>
          )}

          {actual.id === "redes" && (
            !MARCA ? (
              <p className="va-aviso">
                La marca no se vende, así que esta etapa queda en 0 puntos: el comprador parte con un nombre nuevo y pierde la
                reputación de las redes y de Google. Si es una cafetería, restaurante, panadería, botillería, minimarket o tienda,
                el valor baja además 10%. Puedes cambiarlo en «Qué se vende».
              </p>
            ) : (
              <div className="pf-grid tres">
                {REDES ? (
                  <>
                    <Campo label="Seguidores en Instagram"><Entero value={d.instagram} onChange={set("instagram")} placeholder="0" /></Campo>
                    <Campo label="Seguidores en TikTok"><Entero value={d.tiktok} onChange={set("tiktok")} placeholder="0" /></Campo>
                    <Campo label="Seguidores en Facebook"><Entero value={d.facebook} onChange={set("facebook")} placeholder="0" /></Campo>
                  </>
                ) : <p className="pf-ayuda va-ancho">Las cuentas de redes sociales no se venden: los seguidores no suman puntos.</p>}
                <Campo label="Nota en Google"><input inputMode="decimal" maxLength={3} value={d.notaGoogle} onChange={(e) => set("notaGoogle")(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="4,6" /></Campo>
                <Campo label="Cantidad de reseñas en Google"><Entero value={d.resenasGoogle} onChange={set("resenasGoogle")} placeholder="120" /></Campo>
                <Opciones label="¿La marca está registrada en INAPI?" value={d.marcaInapi} onChange={set("marcaInapi")} opciones={SN} />
              </div>
            )
          )}

          {actual.id === "resultado" && (
            <div className="va-resultado">
              <div className="va-puntaje">
                <strong>{fmtPts(r.puntaje)}</strong><span>de 100 puntos</span>
                <small>{fmtPts(r.puntosObtenidos)} de {fmtPts(r.puntosAplicables)} puntos de las preguntas que aplican a tu venta, llevados a base 100. Factor de calidad: ×{f1(r.factor)} sobre el valor de mercado{r.techo ? ` · Puntaje limitado a ${r.techo.valor} porque ${r.techo.motivo}.` : ""}</small>
              </div>
              <ul className="va-dims">
                {r.dimensiones.map((x) => (
                  <li key={x.id}>
                    <button type="button" onClick={() => ir(x.n)}>
                      <span>{x.n}. {x.titulo}</span>
                      <span className="pf-barra"><i style={{ width: `${(x.puntos / x.max) * 100}%` }} /></span>
                      <span className="num">{fmtPts(x.puntos)} / {fmtPts(x.max)}</span>
                    </button>
                    {x.penalizacion > 0 && <small className="va-pen">−{fmtPts(x.penalizacion)} pts por deuda {x.deuda > 0 ? `de ${clp(x.deuda)}` : "declarada (falta el monto)"}</small>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="va-nav">
            {paso > 0 && <button type="button" className="btn ghost" onClick={() => ir(paso - 1)}>← Anterior</button>}
            {paso < PASOS.length - 1 && <button type="button" className="btn" onClick={() => ir(paso + 1)}>{paso === PASOS.length - 2 ? "Ver resultado →" : "Siguiente →"}</button>}
          </div>
        </section>
      </div>

      <a className="va-barra" href="#va-resultado">
        <span>{fmtPts(r.puntaje)} pts</span>
        <strong className={valorPanel.nublado ? "va-oculto" : undefined}>{valorPanel.valor}</strong>
        <em>Ver ↓</em>
      </a>

      {/* Columna derecha (escritorio): etapas y, debajo, el valor. En pantallas chicas se ordena como antes. */}
      <div className="va-lado">
        <nav className="va-etapas" aria-label="Etapas" ref={etapas}>
          {PASOS.map((p, i) => {
            const x = r.dimensiones.find((y) => y.id === p.id);
            return (
              <button key={p.id} type="button" className={i === paso ? "on" : x?.respondida || (p.id === "venta" && r.alcance.definido) ? "hecho" : undefined} onClick={() => ir(i)} aria-current={i === paso ? "step" : undefined}>
                <span className="va-n">{i === 0 ? "?" : i < PASOS.length - 1 ? i : "✓"}</span>
                <span className="va-t">{p.t}<small>{x ? `${fmtPts(x.puntos)} / ${fmtPts(x.max)}` : p.id === "venta" ? (r.alcance.definido ? "listo" : "sin puntos") : `${fmtPts(r.puntaje)} / 100`}</small></span>
              </button>
            );
          })}
        </nav>
      <aside className="va-res" id="va-resultado" aria-live="polite">
        <div className="va-total">
          <span>{valorPanel.etiqueta}</span>
          <strong className={valorPanel.nublado ? "va-oculto" : undefined} aria-hidden={valorPanel.nublado || undefined}>{valorPanel.valor}</strong>
          <small>{valorPanel.nota}</small>
          <div className="va-total-pts"><b>{fmtPts(r.puntaje)}</b> de 100 puntos de calidad</div>
        </div>
        {ver && r.listo && (
          <div className="va-tope">
            {r.ajustes.map((a) => <p key={a} className="va-ajuste-txt">{a}.</p>)}
            <div><span>Utilidad normalizada × 12 × {f1(r.multiplo)}<small className="va-sector">{r.sectorMercado} en Latinoamérica, ajustado a Chile y a un negocio {r.tamano}.</small></span><span className="num">{clp(r.base)}</span></div>
            <div><span>× factor de calidad {f1(r.factor)} ({fmtPts(r.puntaje)} puntos)</span><span className="num">{clp(r.ajustado)}</span></div>
            {r.entorno.monto !== 0 && <div className={r.entorno.monto < 0 ? "va-deuda" : undefined}><span>{r.entorno.monto > 0 ? "+" : "−"} Entorno ({pctTxt(r.entorno.pct)})<small className="va-sector">{r.entorno.lineas.map((x) => x.t.split(":")[0]).join(" · ")}</small></span><span className="num">{r.entorno.monto > 0 ? "+" : "−"}{clp(Math.abs(r.entorno.monto))}</span></div>}
            <div><span>Máximo por contrato: utilidad × {fmtPts(r.mesesTopeContrato)} meses<small className="va-sector">{Math.round(r.pctTope * 100)}% de {r.mesesContrato} meses{r.mesesRenovacion ? ` (incluye ${r.mesesRenovacion} de renovación)` : ""}{r.pctTope < 0.5 ? " · con Gold o Platinum verificada sube a 50%" : ""}</small></span><span className="num">{clp(r.topeContrato)}</span></div>
            {r.descuentoMarca > 0 && <div className="va-deuda"><span>− Sin marca (−10% en {d.rubro.toLowerCase()})</span><span className="num">−{clp(r.descuentoMarca)}</span></div>}
            {r.pisoAplicado && <div><span>Piso: valor de los equipos</span><span className="num">{clp(r.piso)}</span></div>}
            {r.mercaderia > 0 && <div><span>+ Mercadería a costo</span><span className="num">{clp(r.mercaderia)}</span></div>}
            {r.vehiculos > 0 && <div><span>+ Vehículos (valor depreciado)</span><span className="num">{clp(r.vehiculos)}</span></div>}
            {r.deudas.map((x) => <div key={x.t} className="va-deuda"><span>− {x.t}</span><span className="num">−{clp(x.monto)}</span></div>)}
            {r.saldoCaja > 0 && <div><span>Saldo en la cuenta: se suma al precio si queda al cerrar<small className="va-sector">No es parte del valor del negocio: con él, el precio sería {clp(r.valor + r.saldoCaja)}.</small></span><span className="num">+{clp(r.saldoCaja)}</span></div>}
            {r.topeAplicado && <p>El valor supera lo que el contrato de arriendo permite recuperar, así que se limita a ese máximo. Un anexo que alargue el contrato lo subiría.</p>}
          </div>
        )}
        {ver && r.listo && (
          <div className="va-acciones">
            <a className="btn" href="/?interes=derecho-de-llave#contacto">Quiero vender mi negocio</a>
            <button type="button" className="btn ghost" onClick={imprimir}>Imprimir o guardar PDF</button>
          </div>
        )}
        {r.listo && <Certificado datos={d} cobro={cobro} pagado={cobro && pagadoEstos ? pagado!.token : null} />}
        <MultiplosEbitda rubro={d.rubro} />
        <p className="va-nota">
          Valor referencial: múltiplo de mercado del rubro ajustado por un puntaje de calidad de 0 a 100. No reemplaza una
          tasación profesional; el precio final lo acuerdan comprador y vendedor.
        </p>
      </aside>
      </div>
    </div>
  );
}
