'use client';

import { useCallback, useEffect, useState } from 'react';

const pesos = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-CL')}`;
const fecha = (iso) => new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
const REVISION = {
  no_aplica: 'Standard',
  pendiente_docs: 'Esperando documentos',
  en_revision: 'Por revisar',
  verificado: 'Verificado',
  rechazado: 'Emitido como Standard',
};
const RESULTADO = { coincide: 'Coincide', corregido: 'Corregido', difiere: 'Difiere', falta: 'Falta', alerta: 'Revisar', info: 'Dato' };

// Certificados de Valorización Pyme: lista, revisión de Gold y Platinum, y carpetas tributarias que no se pudieron leer.
export default function Certificados({ token }) {
  const [datos, setDatos] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [error, setError] = useState('');

  const api = useCallback(
    async (url, cuerpo) => {
      const r = await fetch(url, {
        method: cuerpo ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'No se pudo completar.');
      return j;
    },
    [token]
  );
  const cargar = useCallback(() => {
    api('/api/admin/certificados').then(setDatos).catch((e) => setError(e.message));
  }, [api]);
  useEffect(() => {
    cargar();
  }, [cargar]);

  if (error) return <p className="adm-error" role="alert">{error}</p>;
  if (!datos) return <p className="adm-vacio">Cargando…</p>;
  if (abierto) {
    return <Revision id={abierto} api={api} volver={() => { setAbierto(null); cargar(); }} />;
  }
  return (
    <>
      <div className="adm-tabla-caja">
        <table className="adm-tabla">
          <thead>
            <tr><th>N°</th><th>Fecha</th><th>Negocio</th><th>Cliente</th><th>Plan</th><th>Valor</th><th>Pago</th><th>Revisión</th><th /></tr>
          </thead>
          <tbody>
            {datos.certificados.map((c) => (
              <tr key={c.id}>
                <td>{c.folio}</td>
                <td>{fecha(c.creado_en)}</td>
                <td>{c.negocio}</td>
                <td>{c.nombre}<br /><small>{c.correo}</small></td>
                <td>{c.plan}</td>
                <td>{pesos(c.valor)}</td>
                <td>{c.estado === 'pagado' ? pesos(c.monto) : c.estado}</td>
                <td>{REVISION[c.revision] ?? c.revision}</td>
                <td><button type="button" className="adm-btn adm-btn-linea" onClick={() => setAbierto(c.id)}>Abrir</button></td>
              </tr>
            ))}
            {!datos.certificados.length && <tr><td colSpan={9} className="adm-vacio">Todavía no hay certificados.</td></tr>}
          </tbody>
        </table>
      </div>
      <h2 style={{ marginTop: '2rem' }}>Carpetas tributarias</h2>
      {datos.carpetas.map((x) => <Carpeta key={x.id} x={x} api={api} onCambio={cargar} />)}
      {!datos.carpetas.length && <p className="adm-vacio">Todavía no hay carpetas.</p>}
    </>
  );
}

function Carpeta({ x, api, onCambio }) {
  const [periodos, setPeriodos] = useState((x.periodos ?? []).map((p) => `${p.periodo}; ${p.ventas}; ${p.compras}`).join('\n'));
  const [estado, setEstado] = useState(x.estado);
  const [nota, setNota] = useState(x.nota ?? '');
  const [msg, setMsg] = useState('');
  async function guardar() {
    setMsg('');
    try {
      await api('/api/admin/certificados', { accion: 'carpeta', id: x.id, estado, periodos, nota });
      setMsg('Guardado.');
      onCambio();
    } catch (e) {
      setMsg(e.message);
    }
  }
  return (
    <div className="adm-panel" style={{ padding: '1rem', marginBottom: '0.75rem', display: 'grid', gap: '0.5rem' }}>
      <strong>{x.razon || x.nombre_archivo || 'Carpeta'}</strong>
      <small>
        {x.rut || 'RUT no leído'} · {fecha(x.creado_en)} · {x.meses ? `${x.meses} meses, ventas ${pesos(x.ventas12)}, compras ${pesos(x.compras12)}` : 'Sin cifras'}
        {x.url && <> · <a href={x.url} target="_blank" rel="noopener noreferrer">Ver PDF</a></>}
        {x.codigo_sii && <> · Código SII: <code>{x.codigo_sii}</code>{x.clave_sii && <> · clave: <code>{x.clave_sii}</code></>}</>}
      </small>
      <textarea rows={4} value={periodos} aria-label="Cifras por mes" placeholder={'2026-09; 12000000; 4800000\n2026-08; 11500000; 4600000'} onChange={(e) => setPeriodos(e.target.value)} />
      <select value={estado} aria-label="Estado de la carpeta" onChange={(e) => setEstado(e.target.value)}>
        <option value="revision">En revisión</option>
        <option value="leida">Leída</option>
        <option value="verificada">Verificada en el SII</option>
        <option value="rechazada">Rechazada</option>
      </select>
      <input value={nota} maxLength={500} aria-label="Nota" placeholder="Nota (si la rechazas, el cliente la ve)" onChange={(e) => setNota(e.target.value)} />
      <div><button type="button" className="adm-btn" onClick={guardar}>Guardar</button> <span role="status">{msg}</span></div>
    </div>
  );
}

function Revision({ id, api, volver }) {
  const [d, setD] = useState(null);
  const [items, setItems] = useState({});
  const [f, setF] = useState({ nota: '', ventaNeta: '', utilidadMensual: '' });
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    const j = await api(`/api/admin/certificados?id=${id}`);
    setD(j);
    const c = j.certificado;
    setF({ nota: c.revision_nota ?? '', ventaNeta: c.verificacion?.correcciones?.ventaNeta ?? '', utilidadMensual: c.verificacion?.correcciones?.utilidadMensual ?? '' });
    setItems(Object.fromEntries(j.documentos.map((x) => [x.tipo, { ok: x.item?.ok !== false, nota: x.item?.nota ?? '' }])));
  }, [api, id]);
  useEffect(() => {
    cargar().catch((e) => setMsg(e.message));
  }, [cargar]);

  async function ejecutar(cuerpo, listo) {
    setOcupado(true);
    setMsg('');
    try {
      await api('/api/admin/certificados', { id, ...cuerpo });
      setMsg(listo);
      await cargar();
    } catch (e) {
      setMsg(e.message);
    }
    setOcupado(false);
  }

  if (!d) return <p className="adm-vacio">{msg || 'Cargando…'}</p>;
  const c = d.certificado;
  const premium = c.plan !== 'standard';
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <p><button type="button" className="adm-btn adm-btn-linea" onClick={volver}>← Certificados</button></p>
      <div className="adm-panel" style={{ padding: '1rem' }}>
        <h2 style={{ margin: 0 }}>N° {c.folio} · {c.negocio}</h2>
        <p>{d.planNombre} · {REVISION[c.revision]} · {c.nombre} · <a href={`mailto:${c.correo}`}>{c.correo}</a> · {c.estado === 'pagado' ? `pagado ${pesos(c.monto)}` : c.estado}</p>
        <p>Valor hoy: <b>{pesos(d.valor)}</b>{premium && <> · si se verifica: <b>{pesos(d.valorVerificado)}</b> (+{Math.round(d.prima * 100)}%)</>} · puntaje {Math.round(d.puntaje)} · utilidad normalizada {pesos(d.utilidadNormalizada)} · deudas {pesos(d.totalDeudas)}</p>
        <p><a href={`/api/certificado/pdf?t=${c.token}`} target="_blank" rel="noopener noreferrer">Ver PDF actual</a> · <a href={`/certificado/${c.token}`} target="_blank" rel="noopener noreferrer">Página del cliente</a></p>
      </div>
      {!premium && <p className="adm-vacio">Certificado Standard: no requiere revisión.</p>}
      {premium && (
        <>
          <div className="adm-panel" style={{ padding: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Lectura automática con IA</h3>
            {!d.ia && <p className="adm-vacio">Inactiva: falta la variable ANTHROPIC_API_KEY en Vercel.</p>}
            {d.ia && c.lectura?.estado && <p>Estado: <b>{c.lectura.estado}</b>{c.lectura.decision ? ` · sugerencia: ${c.lectura.decision}` : ''}{c.lectura.aplicada ? ' (aplicada)' : ''}{c.lectura.error ? ` · ${c.lectura.error}` : ''}</p>}
            {(c.lectura?.motivos ?? []).length > 0 && <ul>{c.lectura.motivos.map((m) => <li key={m}>{m}</li>)}</ul>}
            {(d.lectura?.contrastes ?? []).length > 0 && (
              <div className="adm-tabla-caja">
                <table className="adm-tabla">
                  <thead><tr><th>Dato</th><th>Declarado</th><th>Oficial</th><th>Resultado</th><th>Fuente</th></tr></thead>
                  <tbody>
                    {d.lectura.contrastes.map((x, i) => (
                      <tr key={i}><td>{x.etiqueta}<br /><small>{x.detalle}</small></td><td>{x.declarado}</td><td>{x.oficial}</td><td>{RESULTADO[x.resultado] ?? x.resultado}</td><td>{x.fuente}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {d.ia && <p><button type="button" className="adm-btn adm-btn-linea" disabled={ocupado} onClick={() => ejecutar({ accion: 'releer' }, 'Lectura actualizada.')}>Volver a leer con IA</button></p>}
          </div>
          <div className="adm-panel" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Documentos</h3>
            {d.documentos.map((x) => (
              <div key={x.tipo} style={{ display: 'grid', gap: '0.35rem' }}>
                <strong>{x.titulo}</strong>
                {x.tipo === 'carpeta' ? <small>Revísala en Carpetas tributarias, en la lista anterior.</small> : x.archivos.length ? (
                  <small>{x.archivos.map((a) => <span key={a.nombre}>{a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer">{a.nombre}</a> : a.nombre}{' '}</span>)}</small>
                ) : <small>Sin archivos.</small>}
                <select aria-label={`Resultado de ${x.titulo}`} value={items[x.tipo]?.ok === false ? 'obs' : 'ok'} onChange={(e) => setItems((y) => ({ ...y, [x.tipo]: { ...y[x.tipo], ok: e.target.value === 'ok' } }))}>
                  <option value="ok">Coincide / en orden</option>
                  <option value="obs">Con observación</option>
                </select>
                <input aria-label={`Nota de ${x.titulo}`} maxLength={300} placeholder="Nota (sale en el certificado)" value={items[x.tipo]?.nota ?? ''} onChange={(e) => setItems((y) => ({ ...y, [x.tipo]: { ...y[x.tipo], nota: e.target.value } }))} />
              </div>
            ))}
            <label>Venta neta mensual verificada (opcional) <input inputMode="numeric" value={f.ventaNeta} onChange={(e) => setF({ ...f, ventaNeta: e.target.value })} /></label>
            <label>Utilidad mensual coherente con el SII (opcional) <input inputMode="numeric" value={f.utilidadMensual} onChange={(e) => setF({ ...f, utilidadMensual: e.target.value })} /></label>
            <label>Nota para el cliente <textarea rows={3} maxLength={1500} value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} /></label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="adm-btn" disabled={ocupado} onClick={() => ejecutar({ accion: 'revisar', decision: 'verificar', items, ...f }, 'Marcado como verificado.')}>Aprobar: verificada (+{Math.round(d.prima * 100)}%)</button>
              <button type="button" className="adm-btn adm-btn-linea" disabled={ocupado} onClick={() => ejecutar({ accion: 'revisar', decision: 'corregir', items, ...f }, 'Se pidió la corrección.')}>Pedir corrección</button>
              <button type="button" className="adm-btn adm-btn-linea" disabled={ocupado} onClick={() => ejecutar({ accion: 'revisar', decision: 'standard', items, ...f }, 'Emitido como Standard.')}>Emitir como Standard</button>
            </div>
          </div>
        </>
      )}
      {msg && <p role="status">{msg}</p>}
    </div>
  );
}
