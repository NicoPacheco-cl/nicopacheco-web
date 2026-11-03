'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DIMENSION, OPERACION, ORDEN, calcular, clp, estadoInicial, filasEstado, mesTexto, pct, tasaTexto } from './calculo';
import { crearPdf, nombreArchivo } from './pdf';

const CLAVE = 'np_diagnostico_v1';
const digitos = (t) => Number(String(t).replace(/\D/g, '')) || 0;
const miles = (n) => (n ? Number(n).toLocaleString('es-CL') : '');

// Mantiene el cursor junto al mismo dígito mientras se reinsertan los puntos de miles.
function CampoMonto({ id, valor, alCambiar, etiqueta }) {
  const ref = useRef(null);
  const cursor = useRef(null);
  useLayoutEffect(() => {
    if (cursor.current === null || !ref.current) return;
    const v = ref.current.value;
    let pos = 0, vistos = 0;
    while (pos < v.length && vistos < cursor.current) { if (/\d/.test(v[pos])) vistos += 1; pos += 1; }
    ref.current.setSelectionRange(pos, pos);
    cursor.current = null;
  });
  return (
    <div className="dp-monto">
      <span aria-hidden="true">$</span>
      <input
        ref={ref} id={id} inputMode="numeric" placeholder="0" aria-label={etiqueta} value={miles(valor)} autoComplete="off"
        onChange={(e) => {
          cursor.current = e.target.value.slice(0, e.target.selectionStart ?? 0).replace(/\D/g, '').length;
          alCambiar(digitos(e.target.value));
        }}
      />
    </div>
  );
}

function CampoTasa({ valor, alCambiar }) {
  const [texto, setTexto] = useState(tasaTexto(valor));
  useEffect(() => {
    const leido = parseFloat(texto.replace(',', '.'));
    if ((Number.isNaN(leido) ? 0 : leido) !== valor) setTexto(tasaTexto(valor));
    // Solo se resincroniza cuando la tasa cambia desde afuera (los botones de régimen).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);
  return (
    <div className="dp-monto">
      <input
        id="tasa-renta" inputMode="decimal" autoComplete="off" value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          const r = parseFloat(e.target.value.replace(',', '.'));
          alCambiar(Number.isNaN(r) ? 0 : Math.min(100, Math.max(0, r)));
        }}
      />
    </div>
  );
}

function Dimension({ id, nombre, detalle, monto, porcentaje, abierta, alAlternar, children }) {
  return (
    <section className={abierta ? 'dp-dim abierta' : 'dp-dim'}>
      <button className="dp-dim-cab" type="button" id={`d-${id}`} aria-expanded={abierta} aria-controls={`c-${id}`} onClick={() => alAlternar(id)}>
        <span className="dp-flecha" aria-hidden="true" />
        <span className="dp-dim-nombre">{nombre}{detalle ? <small>{detalle}</small> : null}</span>
        <span className="dp-dim-monto">{monto}</span>
        <span className="dp-dim-pct">{porcentaje}</span>
      </button>
      {abierta ? <div className="dp-dim-cuerpo" id={`c-${id}`}>{children}</div> : null}
    </section>
  );
}

function Banda({ etiqueta, nota, monto, porcentaje, final }) {
  const negativo = typeof monto === 'number' && monto < 0;
  return (
    <div className={final ? 'dp-banda final' : 'dp-banda'}>
      <b>{etiqueta}{nota ? <small>{nota}</small> : null}</b>
      <span className={negativo ? 'dp-b-monto negativo' : 'dp-b-monto'}>{typeof monto === 'number' ? clp(monto) : ''}</span>
      <span className="dp-b-pct">{porcentaje}</span>
    </div>
  );
}

function Total({ etiqueta, monto, porcentaje }) {
  return (
    <div className="dp-total">
      <span>{etiqueta}</span>
      <span className="dp-t-monto">{monto}</span>
      <span className="dp-t-pct">{porcentaje}</span>
    </div>
  );
}

export default function Diagnostico() {
  const [e, setE] = useState(() => estadoInicial(false));
  const [abierta, setAbierta] = useState('ingresos');
  const [deshacer, setDeshacer] = useState(null);
  const [cargado, setCargado] = useState(false);
  const [aviso, setAviso] = useState('');
  const [respaldo, setRespaldo] = useState('');
  const [generando, setGenerando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const enfocar = useRef(null);
  const desplazar = useRef(null);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE);
      // Corrección única al abrir: lo guardado solo existe en el navegador, no se puede leer antes de montar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (guardado) setE(JSON.parse(guardado));
    } catch {}
    setCargado(true);
  }, []);
  useEffect(() => {
    if (!cargado) return;
    try { localStorage.setItem(CLAVE, JSON.stringify(e)); } catch {}
  }, [e, cargado]);
  useEffect(() => {
    if (enfocar.current) {
      const campo = document.getElementById(enfocar.current);
      enfocar.current = null;
      if (campo) { campo.focus(); campo.select?.(); }
    }
    if (desplazar.current) {
      const cab = document.getElementById(desplazar.current);
      desplazar.current = null;
      if (cab) { cab.focus({ preventScroll: true }); cab.scrollIntoView({ block: 'start' }); }
    }
  });
  useEffect(() => {
    if (!confirmarBorrado) return undefined;
    const t = setTimeout(() => setConfirmarBorrado(false), 4000);
    return () => clearTimeout(t);
  }, [confirmarBorrado]);

  const c = calcular(e);
  const sv = (n) => pct(c.sobreVentas(n));

  const cambiar = (parche) => setE((prev) => ({ ...prev, ...parche }));
  const cambiarNegocio = (k, v) => setE((prev) => ({ ...prev, negocio: { ...prev.negocio, [k]: v } }));
  const cambiarCuenta = (dim, id, parche) => setE((prev) => ({
    ...prev,
    cuentas: { ...prev.cuentas, [dim]: prev.cuentas[dim].map((a) => (a.id === id ? { ...a, ...parche } : a)) },
  }));
  const agregarCuenta = (dim) => {
    const id = e.siguienteId;
    enfocar.current = `n-${id}`;
    setE((prev) => ({ ...prev, siguienteId: id + 1, cuentas: { ...prev.cuentas, [dim]: [...prev.cuentas[dim], { id, nombre: 'Nueva cuenta', monto: 0 }] } }));
  };
  const eliminarCuenta = (dim, id) => {
    const lista = e.cuentas[dim];
    const indice = lista.findIndex((a) => a.id === id);
    if (indice < 0) return;
    setDeshacer({ dim, indice, cuenta: lista[indice] });
    setE((prev) => ({ ...prev, cuentas: { ...prev.cuentas, [dim]: prev.cuentas[dim].filter((a) => a.id !== id) } }));
  };
  const recuperarCuenta = () => {
    if (!deshacer) return;
    const { dim, indice, cuenta } = deshacer;
    setE((prev) => {
      const lista = [...prev.cuentas[dim]];
      lista.splice(indice, 0, cuenta);
      return { ...prev, cuentas: { ...prev.cuentas, [dim]: lista } };
    });
    setDeshacer(null);
  };
  const alternar = (id) => {
    setDeshacer(null);
    setAviso('');
    setRespaldo('');
    if (abierta === id) { setAbierta(null); return; }
    desplazar.current = `d-${id}`;
    setAbierta(id);
  };
  const abrir = (id) => { setDeshacer(null); setAviso(''); setRespaldo(''); desplazar.current = `d-${id}`; setAbierta(id); };
  const siguiente = (id) => ORDEN[ORDEN.indexOf(id) + 1];
  const textoSiguiente = (id) => {
    const n = siguiente(id);
    if (n === 'resultado') return 'Ver resultado';
    return `Continuar con ${DIMENSION[n] ? DIMENSION[n].nombre : 'Impuestos'}`;
  };
  const reiniciar = (conEjemplo) => {
    setE(estadoInicial(conEjemplo));
    setDeshacer(null);
    setAviso('');
    setRespaldo('');
    setConfirmarBorrado(false);
    setAbierta('ingresos');
    window.scrollTo(0, 0);
  };

  async function descargarPdf() {
    setGenerando(true);
    setAviso('');
    try {
      const bytes = await crearPdf(e);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo(e);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setAviso('PDF listo. Revisa tus descargas.');
    } catch {
      setAviso('No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      setGenerando(false);
    }
  }

  async function copiarExcel() {
    const texto = filasEstado(e, c).map((f) => [f.etiqueta, f.monto === null || f.monto === undefined ? '' : Math.round(f.monto), f.porcentaje && f.porcentaje !== '—' ? f.porcentaje : ''].join('\t')).join('\n');
    try {
      await navigator.clipboard.writeText(texto);
      setRespaldo('');
      setAviso('Copiado. Ya puedes pegarlo en Excel o Google Sheets.');
    } catch {
      setRespaldo(texto);
      setAviso('Tu navegador no permitió copiar directo. Selecciona el texto de abajo y cópialo.');
    }
  }

  const propsDimension = (id) => {
    const n = e.cuentas[id].length;
    return { id, nombre: DIMENSION[id].nombre, detalle: n === 1 ? '1 cuenta' : `${n} cuentas`, monto: clp(c.totales[id]), porcentaje: sv(c.totales[id]), abierta: abierta === id, alAlternar: alternar };
  };

  const cuerpoDimension = (id) => {
    const d = DIMENSION[id];
    const lista = e.cuentas[id];
    return (
      <>
        <p className="dp-pregunta">{d.pregunta}</p>
        <div className="dp-cuentas">
          {lista.length === 0 ? <p className="dp-ayuda">Esta dimensión no tiene cuentas. Agrega una si la necesitas.</p> : null}
          {lista.map((a) => (
            <div className="dp-cuenta" key={a.id}>
              <input className="dp-cuenta-nombre" id={`n-${a.id}`} value={a.nombre} placeholder="Nombre de la cuenta" aria-label="Nombre de la cuenta" autoComplete="off" onChange={(ev) => cambiarCuenta(id, a.id, { nombre: ev.target.value })} />
              <CampoMonto id={`m-${a.id}`} valor={a.monto} etiqueta={`Monto de ${a.nombre}`} alCambiar={(monto) => cambiarCuenta(id, a.id, { monto })} />
              <output>{sv(Number(a.monto) || 0)}</output>
              <button className="dp-quitar" type="button" aria-label={`Eliminar ${a.nombre}`} title="Eliminar cuenta" onClick={() => eliminarCuenta(id, a.id)}>×</button>
            </div>
          ))}
        </div>
        <div className="dp-acciones-cuenta">
          <button className="dp-sec" type="button" onClick={() => agregarCuenta(id)}>+ {d.agregar || 'Agregar cuenta'}</button>
          {deshacer && deshacer.dim === id ? <span>Eliminaste «{deshacer.cuenta.nombre}». <button className="dp-enlace" type="button" onClick={recuperarCuenta}>Deshacer</button></span> : null}
        </div>
        {id === 'ingresos' ? (
          <div className="dp-fija primera">
            <label htmlFor="ventas-anterior">Ventas del mes anterior</label>
            <CampoMonto id="ventas-anterior" valor={e.ventasAnterior} etiqueta="Ventas del mes anterior" alCambiar={(ventasAnterior) => cambiar({ ventasAnterior })} />
            <output />
          </div>
        ) : null}
        <Total etiqueta={d.total} monto={clp(c.totales[id])} porcentaje={sv(c.totales[id])} />
        <div className="dp-seguir"><button className="btn btn-negro" type="button" onClick={() => abrir(siguiente(id))}>{textoSiguiente(id)}</button></div>
      </>
    );
  };

  const cuerpoImpuestos = (
    <>
      <p className="dp-pregunta">¿Cuánto pagaste al SII este mes y qué tasa de renta aplica a tu empresa?</p>
      <div className="dp-grupo">
        <h3>Impuestos mensuales</h3>
        <div>
          <div className="dp-fija primera">
            <label htmlFor="iva">IVA del SII (19%)</label>
            <CampoMonto id="iva" valor={e.iva} etiqueta="IVA del SII" alCambiar={(iva) => cambiar({ iva })} />
            <output>{sv(c.iva)}</output>
          </div>
          <div className="dp-fija">
            <label htmlFor="ppm">PPM (pago provisional mensual)</label>
            <CampoMonto id="ppm" valor={e.ppm} etiqueta="PPM" alCambiar={(ppm) => cambiar({ ppm })} />
            <output>{sv(c.ppm)}</output>
          </div>
        </div>
        <div className="dp-referencia">
          <span>{e.modoIva === 'con' ? 'Referencia: IVA incluido en ventas menos costos directos, ' : 'Referencia: 19% sobre ventas menos costos directos, '}{clp(c.ivaReferencia)}. No considera el IVA de otros gastos.</span>
          <button className="dp-sec" type="button" onClick={() => cambiar({ iva: c.ivaReferencia })}>Usar referencia</button>
        </div>
        <Total etiqueta="Total a pagar este mes" monto={clp(c.totalMensual)} porcentaje={sv(c.totalMensual)} />
      </div>
      <div className="dp-grupo">
        <h3>Impuesto a la renta / utilidades</h3>
        <div className="dp-fija primera">
          <label htmlFor="tasa-renta">Tasa de impuesto (%)</label>
          <CampoTasa valor={e.tasaRenta} alCambiar={(tasaRenta) => cambiar({ tasaRenta })} />
          <output />
        </div>
        <div className="dp-opciones">
          <button className="dp-sec" type="button" onClick={() => cambiar({ tasaRenta: 12.5 })}>12,5% Pro Pyme General</button>
          <button className="dp-sec" type="button" onClick={() => cambiar({ tasaRenta: 0 })}>0% Pro Pyme Transparente</button>
          <button className="dp-sec" type="button" onClick={() => cambiar({ tasaRenta: 27 })}>27% Régimen General</button>
        </div>
        <Total etiqueta="Total a pagar (estimado)" monto={clp(c.renta)} porcentaje={sv(c.renta)} />
      </div>
      <p className="dp-ayuda">El PPM es un anticipo del impuesto a la renta, por eso no se resta dos veces. Confirma tu régimen y tasa con tu contador: la tasa de 12,5% es transitoria y exige cumplir requisitos.</p>
      <div className="dp-seguir"><button className="btn btn-negro" type="button" onClick={() => abrir('resultado')}>Ver resultado</button></div>
    </>
  );

  const cuerpoResultado = () => {
    if (c.ingresos <= 0) {
      return (
        <>
          <p>Todavía no hay ingresos para calcular tu resultado. Ingresa tus ventas para ver el estado de resultados completo.</p>
          <div><button className="btn btn-negro" type="button" onClick={() => abrir('ingresos')}>Ir a ingresos</button></div>
        </>
      );
    }
    const por100 = (n) => (n / c.ingresos) * 100;
    const items = [['Costos directos', c.totales.directos], ...OPERACION.map((id) => [DIMENSION[id].nombre, c.totales[id]]), ['Créditos', c.totales.creditos], ['Impuestos', c.impuestos]];
    const maximo = Math.max(...items.map((i) => por100(i[1])), Math.abs(por100(c.neta)));
    const f100 = (n) => `${n < 0 ? '−' : ''}$${Math.abs(n).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    const barra = (etiqueta, n, clase = '') => (
      <div className={`dp-barra ${clase}`} key={etiqueta}>
        <span>{etiqueta}</span>
        <span className="dp-pista"><i style={{ width: `${maximo > 0 ? (Math.abs(n) / maximo) * 100 : 0}%` }} /></span>
        <span className={n < 0 ? 'dp-b-val negativo' : 'dp-b-val'}>{f100(n)}</span>
      </div>
    );
    const titulo = [e.negocio.nombre, mesTexto(e.negocio.periodo)].filter(Boolean).join(' · ');
    return (
      <>
        {titulo ? <p className="dp-pregunta">{titulo}</p> : null}
        <div className="dp-kpis">
          <div><span>Margen de contribución</span><b className={c.margen < 0 ? 'negativo' : ''}>{sv(c.margen)}</b></div>
          <div><span>EBITDA</span><b className={c.ebitda < 0 ? 'negativo' : ''}>{clp(c.ebitda)}</b></div>
          <div><span>Utilidad neta final</span><b className={c.neta < 0 ? 'negativo' : 'positivo'}>{clp(c.neta)}</b></div>
        </div>
        <div className="dp-barras" role="group" aria-label="De cada 100 pesos vendidos">
          <h3>De cada $100 que vendes</h3>
          {items.map((i) => barra(i[0], por100(i[1])))}
          {barra('Te queda', por100(c.neta), c.neta < 0 ? 'mala' : 'buena')}
        </div>
        {e.modoIva === 'con' ? <p className="dp-ayuda">Ingresos, costos, margen y EBITDA incluyen IVA, porque así se ingresaron los montos. El IVA pagado al SII se descuenta antes de la utilidad neta.</p> : null}
        <div className="dp-res-cab">
          <h3>Estado de resultados completo</h3>
          <span className="dp-opciones">
            <button className="btn btn-negro btn-chico" type="button" disabled={generando} onClick={descargarPdf}>{generando ? 'Generando…' : 'Descargar PDF'}</button>
            <button className="dp-sec" type="button" onClick={copiarExcel}>Copiar para Excel</button>
          </span>
        </div>
        {aviso ? <p className="dp-ayuda" aria-live="polite">{aviso}</p> : null}
        {respaldo ? <textarea className="dp-respaldo" readOnly value={respaldo} aria-label="Estado de resultados para copiar" /> : null}
        <div className="dp-tabla">
          <table>
            <tbody>
              {filasEstado(e, c).map((f, i) => (
                <tr className={`dp-fila-${f.tipo}`} key={`${i}-${f.etiqueta}`}>
                  <td>{f.etiqueta}</td>
                  <td className={f.monto < 0 ? 'negativo' : ''}>{f.monto === null || f.monto === undefined ? '' : clp(f.monto)}</td>
                  <td>{f.porcentaje || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dp-siguiente-paso">
          <div>
            <h3>¿Quieres revisar estos números conmigo?</h3>
            <p>En el Diagnóstico Pyme analizamos tu empresa en dos reuniones y te entrego un informe con los problemas y las estrategias para revertirlos.</p>
          </div>
          <a className="btn btn-linea" href="/?interes=diagnostico#contacto">Agendar Diagnóstico Pyme</a>
        </div>
      </>
    );
  };

  return (
    <div className="dp-app">
      {e.ejemplo ? (
        <div className="dp-aviso">
          <p><strong>Este es un ejemplo.</strong> Los montos son de una cafetería ficticia.</p>
          <button className="dp-sec" type="button" onClick={() => reiniciar(false)}>Empezar con mis datos</button>
        </div>
      ) : null}

      <div className="dp-negocio">
        <label>Nombre de la pyme<input className="dp-txt" id="nombre-pyme" value={e.negocio.nombre} autoComplete="organization" onChange={(ev) => cambiarNegocio('nombre', ev.target.value)} /></label>
        <label>Rubro<input className="dp-txt" id="rubro" value={e.negocio.rubro} autoComplete="off" onChange={(ev) => cambiarNegocio('rubro', ev.target.value)} /></label>
        <label>Mes que vas a analizar<input className="dp-txt" id="periodo" type="month" value={e.negocio.periodo} onChange={(ev) => cambiarNegocio('periodo', ev.target.value)} /></label>
      </div>

      <fieldset className="dp-iva">
        <legend>¿Cómo vas a ingresar tus montos?</legend>
        <label><input type="radio" name="modo-iva" id="iva-con" checked={e.modoIva === 'con'} onChange={() => cambiar({ modoIva: 'con' })} /><span><strong>Con IVA (más fácil).</strong> Usa los montos de tus boletas y facturas. El IVA pagado al SII se resta para llegar a la utilidad.</span></label>
        <label><input type="radio" name="modo-iva" id="iva-sin" checked={e.modoIva === 'sin'} onChange={() => cambiar({ modoIva: 'sin' })} /><span><strong>Sin IVA.</strong> Usa montos netos. El IVA se muestra como pago, pero no resta de la utilidad.</span></label>
      </fieldset>

      <div className="dp-estado">
        <Dimension {...propsDimension('ingresos')}>{cuerpoDimension('ingresos')}</Dimension>
        <Banda etiqueta="% crecimiento de venta" porcentaje={pct(c.crecimiento)} />
        <Dimension {...propsDimension('directos')}>{cuerpoDimension('directos')}</Dimension>
        <Banda etiqueta="Margen de contribución" monto={c.margen} porcentaje={sv(c.margen)} />
        {OPERACION.map((id) => <Dimension key={id} {...propsDimension(id)}>{cuerpoDimension(id)}</Dimension>)}
        <Banda etiqueta="Total costos de operación" nota={c.operacionSobreMargen === null ? null : `${pct(c.operacionSobreMargen)} del margen de contribución`} monto={c.operacion} porcentaje={sv(c.operacion)} />
        <Banda etiqueta="EBITDA" monto={c.ebitda} porcentaje={sv(c.ebitda)} />
        <Dimension {...propsDimension('creditos')}>{cuerpoDimension('creditos')}</Dimension>
        <Banda etiqueta="Utilidad antes de impuestos" monto={c.antesImpuestos} porcentaje={sv(c.antesImpuestos)} />
        <Dimension id="impuestos" nombre="Impuestos" detalle="IVA, PPM y renta" monto={clp(c.impuestos)} porcentaje={sv(c.impuestos)} abierta={abierta === 'impuestos'} alAlternar={alternar}>{cuerpoImpuestos}</Dimension>
        <Banda etiqueta="Utilidad neta final" monto={c.neta} porcentaje={sv(c.neta)} final />
        <Dimension id="resultado" nombre="Resultado" detalle="Resumen, PDF y estado de resultados completo" abierta={abierta === 'resultado'} alAlternar={alternar}>{abierta === 'resultado' ? cuerpoResultado() : null}</Dimension>
      </div>

      <div className="dp-pie">
        <span>Tus respuestas se guardan solo en este navegador. No se envían a nadie.</span>
        <span className="dp-opciones">
          {e.ejemplo ? null : <button className="dp-sec" type="button" onClick={() => reiniciar(true)}>Ver ejemplo</button>}
          <button className="dp-sec" type="button" onClick={() => { if (confirmarBorrado) reiniciar(false); else setConfirmarBorrado(true); }}>{confirmarBorrado ? 'Confirmar borrado' : 'Borrar datos'}</button>
        </span>
      </div>

      <div className="dp-resumen" aria-label="Resumen">
        <div>Ventas<b>{clp(c.ingresos)}</b></div>
        <div>EBITDA<b className={c.ebitda < 0 ? 'negativo' : ''}>{clp(c.ebitda)}</b></div>
        <div>Utilidad neta<b className={c.neta < 0 ? 'negativo' : ''}>{clp(c.neta)}</b></div>
      </div>
    </div>
  );
}
