'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Certificados from './Certificados';
import './admin.css';

const ADMIN = 'nikolaspacheco@gmail.com';
// Datos públicos del proyecto (la seguridad la dan las reglas RLS de la base de datos).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hcbbbygrtxlpqjsmcjgh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_JZxTWev-BIEr-DJ0iG5Pqw_uF17l9Wf'
);

const pesos = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-CL')}`;
const num = (n) => Number(n || 0).toLocaleString('es-CL');
const fecha = (iso) => new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
const fechaHora = (iso) =>
  new Date(iso).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const dia = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });

const ESTADOS = ['pendiente', 'en_proceso', 'pagado', 'entregado', 'rechazado', 'cancelado', 'reembolsado'];
const NOMBRE_ESTADO = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  pagado: 'Pagado',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
};
const PAGADOS = new Set(['pagado', 'entregado']);
const NOMBRE_SECCION = {
  inicio: 'Portada',
  'diagnostico-gratis': 'Diagnóstico gratis',
  'planilla-gratis': 'Planilla gratis',
  servicios: 'Servicios',
  podcast: 'Podcast',
  libro: 'Libro',
  tienda: 'Planillas',
  eventos: 'Conferencias',
  'sobre-mi': 'Sobre mí',
  boletin: 'Boletín',
  contacto: 'Contacto',
};
const ENTREGA = {
  despacho: 'Despacho Blue Express',
  retiro_puerto_montt: 'Retiro Puerto Montt',
  retiro_puerto_varas: 'Retiro Puerto Varas',
};

// ---------- Acceso ----------

function Acceso() {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [ver, setVer] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  async function entrar(e) {
    e.preventDefault();
    setError('');
    setAviso('');
    if (correo.trim().toLowerCase() !== ADMIN) return setError('Este correo no tiene acceso al panel.');
    setEntrando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: ADMIN, password: clave });
    setEntrando(false);
    if (error) setError('Correo o clave incorrectos.');
  }

  async function recuperar() {
    setError('');
    setAviso('');
    const { error } = await supabase.auth.resetPasswordForEmail(ADMIN, { redirectTo: `${location.origin}/admin` });
    if (error) setError(`No pudimos enviar el correo: ${error.message}`);
    else setAviso(`Te enviamos un correo a ${ADMIN} para crear una clave nueva.`);
  }

  return (
    <main className="adm-acceso">
      <form onSubmit={entrar} className="adm-acceso-caja">
        <p className="adm-marca">NICO PACHECO®</p>
        <h1>Panel de administración</h1>
        <label>
          <span>Correo</span>
          <input type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} required autoFocus />
        </label>
        <label>
          <span>Clave</span>
          <span className="adm-clave">
            <input
              type={ver ? 'text' : 'password'}
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
            />
            <button type="button" onClick={() => setVer(!ver)}>
              {ver ? 'Ocultar' : 'Ver'}
            </button>
          </span>
        </label>
        {error && <p className="adm-error">{error}</p>}
        {aviso && <p className="adm-ok">{aviso}</p>}
        <button type="submit" className="adm-btn" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
        <button type="button" className="adm-link" onClick={recuperar}>
          Olvidé mi clave
        </button>
      </form>
    </main>
  );
}

function CrearClave({ titulo = 'Crea tu clave', alListo, alCancelar }) {
  const [clave, setClave] = useState('');
  const [repite, setRepite] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    if (clave.length < 8) return setError('La clave debe tener al menos 8 caracteres.');
    if (clave !== repite) return setError('Las dos claves no coinciden.');
    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password: clave });
    setGuardando(false);
    if (error) setError(error.message.includes('different') ? 'La clave nueva debe ser distinta de la anterior.' : error.message);
    else alListo();
  }

  return (
    <main className="adm-acceso">
      <form onSubmit={guardar} className="adm-acceso-caja">
        <p className="adm-marca">NICO PACHECO®</p>
        <h1>{titulo}</h1>
        <p className="adm-ayuda" style={{ margin: 0 }}>
          Desde ahora entrarás con {ADMIN} y esta clave. Usa al menos 8 caracteres.
        </p>
        <input type="email" autoComplete="username" value={ADMIN} readOnly hidden />
        <label>
          <span>Clave nueva</span>
          <input type="password" autoComplete="new-password" value={clave} onChange={(e) => setClave(e.target.value)} required autoFocus />
        </label>
        <label>
          <span>Repite la clave</span>
          <input type="password" autoComplete="new-password" value={repite} onChange={(e) => setRepite(e.target.value)} required />
        </label>
        {error && <p className="adm-error">{error}</p>}
        <button type="submit" className="adm-btn" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar clave'}
        </button>
        {alCancelar && (
          <button type="button" className="adm-link" onClick={alCancelar}>
            Volver al panel
          </button>
        )}
      </form>
    </main>
  );
}

// ---------- Gráficos simples ----------

function BarrasDias({ serie }) {
  const max = Math.max(1, ...serie.map((d) => d.valor));
  return (
    <div className="adm-dias" role="img" aria-label="Visitas por día">
      {serie.map((d) => (
        <div key={d.dia} className="adm-dia" title={`${d.dia}: ${d.valor} visitas`}>
          <span className="adm-dia-barra" style={{ height: `${(d.valor / max) * 100}%` }} />
          <span className="adm-dia-num">{d.valor || ''}</span>
        </div>
      ))}
    </div>
  );
}

function Ranking({ filas, formato = num, vacio = 'Sin datos todavía.' }) {
  if (!filas.length) return <p className="adm-vacio">{vacio}</p>;
  const max = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <ul className="adm-ranking">
      {filas.map((f) => (
        <li key={f.nombre}>
          <span className="adm-ranking-nombre">{f.nombre}</span>
          <span className="adm-ranking-barra">
            <span style={{ width: `${(f.valor / max) * 100}%` }} />
          </span>
          <span className="adm-ranking-valor">{formato(f.valor)}</span>
        </li>
      ))}
    </ul>
  );
}

function agrupar(lista, clave, valor = () => 1, top = 8) {
  const m = new Map();
  for (const x of lista) {
    const k = clave(x);
    m.set(k, (m.get(k) || 0) + valor(x));
  }
  return [...m.entries()]
    .map(([nombre, v]) => ({ nombre, valor: v }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, top);
}

// ---------- Resumen ----------

function Resumen({ visitas, tiempos, pedidos, dias }) {
  const pagados = pedidos.filter((p) => PAGADOS.has(p.estado));
  const visitantes = new Set(visitas.map((v) => v.visitante)).size;
  const ventas = pagados.reduce((s, p) => s + p.total, 0);
  const compradores = new Set(pagados.map((p) => p.correo)).size;

  const serie = useMemo(() => {
    const conteo = {};
    for (const v of visitas) conteo[dia(v.creado_en)] = (conteo[dia(v.creado_en)] || 0) + 1;
    const out = [];
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5).toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
      out.push({ dia: d, valor: conteo[d] || 0 });
    }
    return out;
  }, [visitas, dias]);

  const secciones = useMemo(() => {
    const m = new Map();
    for (const t of tiempos) {
      const x = m.get(t.seccion) || { total: 0, sesiones: new Set() };
      x.total += t.segundos;
      x.sesiones.add(t.sesion);
      m.set(t.seccion, x);
    }
    return [...m.entries()]
      .map(([s, x]) => ({ nombre: NOMBRE_SECCION[s] || s, valor: Math.round(x.total / x.sesiones.size) }))
      .sort((a, b) => b.valor - a.valor);
  }, [tiempos]);

  const fuentes = agrupar(visitas, (v) => v.fuente || v.referente || 'Directo (escribió la dirección)');
  const paises = agrupar(visitas, (v) => v.pais || 'Desconocido', () => 1, 6);
  const dispositivos = agrupar(visitas, (v) => v.dispositivo || 'Desconocido', () => 1, 4);
  const porProducto = agrupar(pagados, (p) => p.producto_nombre, (p) => p.total, 10);

  return (
    <div className="adm-seccion">
      <ul className="adm-kpis">
        <li>
          <span>Visitas</span>
          <strong>{num(visitas.length)}</strong>
        </li>
        <li>
          <span>Visitantes únicos</span>
          <strong>{num(visitantes)}</strong>
        </li>
        <li>
          <span>Ventas pagadas</span>
          <strong>{pesos(ventas)}</strong>
        </li>
        <li>
          <span>Pedidos pagados</span>
          <strong>{num(pagados.length)}</strong>
        </li>
        <li>
          <span>Conversión</span>
          <strong>{visitantes ? `${((compradores / visitantes) * 100).toFixed(1)}%` : '—'}</strong>
          <small>compradores / visitantes</small>
        </li>
      </ul>

      <section className="adm-panel">
        <h3>Visitas por día</h3>
        <BarrasDias serie={serie} />
      </section>

      <div className="adm-grilla">
        <section className="adm-panel">
          <h3>Tiempo promedio por sección</h3>
          <p className="adm-ayuda">Segundos que cada visitante pasa mirando la sección.</p>
          <Ranking filas={secciones} formato={(s) => `${s} s`} />
        </section>
        <section className="adm-panel">
          <h3>De dónde llegan</h3>
          <Ranking filas={fuentes} />
        </section>
        <section className="adm-panel">
          <h3>Ventas por producto</h3>
          <Ranking filas={porProducto} formato={pesos} vacio="Todavía no hay ventas en este período." />
        </section>
        <section className="adm-panel">
          <h3>Países</h3>
          <Ranking filas={paises} />
          <h3 className="adm-h3-sep">Dispositivos</h3>
          <Ranking filas={dispositivos} />
        </section>
      </div>
    </div>
  );
}

// ---------- Pedidos ----------

function Pedidos({ pedidos, onCambio }) {
  const [filtro, setFiltro] = useState('todos');
  const [abierto, setAbierto] = useState(null);
  const lista = pedidos.filter((p) => filtro === 'todos' || (filtro === 'pagados' ? PAGADOS.has(p.estado) : p.estado === filtro));

  async function cambiarEstado(p, estado) {
    const { error } = await supabase.from('pedidos').update({ estado, actualizado_en: new Date().toISOString() }).eq('id', p.id);
    if (error) alertar(error.message);
    else onCambio();
  }

  return (
    <div className="adm-seccion">
      <div className="adm-barra">
        <label>
          Mostrar{' '}
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="pagados">Pagados y entregados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {NOMBRE_ESTADO[e]}
              </option>
            ))}
          </select>
        </label>
        <span className="adm-ayuda">{lista.length} pedidos</span>
      </div>
      {!lista.length ? (
        <p className="adm-vacio">No hay pedidos con este filtro.</p>
      ) : (
        <div className="adm-tabla-caja">
          <table className="adm-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th className="der">Total</th>
                <th>Código</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <FilaPedido
                  key={p.id}
                  p={p}
                  abierto={abierto === p.id}
                  alternar={() => setAbierto(abierto === p.id ? null : p.id)}
                  cambiarEstado={cambiarEstado}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilaPedido({ p, abierto, alternar, cambiarEstado }) {
  return (
    <>
      <tr className={abierto ? 'adm-fila abierta' : 'adm-fila'} onClick={alternar}>
        <td>{fechaHora(p.creado_en)}</td>
        <td>
          <strong>{p.nombre}</strong>
          <small>{p.correo}</small>
        </td>
        <td>
          {p.producto_nombre}
          {p.cantidad > 1 && <small>× {p.cantidad}</small>}
        </td>
        <td className="der">
          {pesos(p.total)}
          {p.descuento > 0 && <small>−{pesos(p.descuento)}</small>}
        </td>
        <td>{p.codigo || '—'}</td>
        <td onClick={(e) => e.stopPropagation()}>
          <select className={`adm-estado e-${p.estado}`} value={p.estado} onChange={(e) => cambiarEstado(p, e.target.value)}>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {NOMBRE_ESTADO[e]}
              </option>
            ))}
          </select>
        </td>
      </tr>
      {abierto && (
        <tr className="adm-detalle">
          <td colSpan={6}>
            <dl>
              <dt>Teléfono</dt>
              <dd>{p.telefono ? <a href={`https://wa.me/${p.telefono.replace(/\D/g, '')}`}>{p.telefono}</a> : '—'}</dd>
              {p.empresa && (
                <>
                  <dt>Empresa</dt>
                  <dd>{p.empresa}</dd>
                </>
              )}
              {p.entrega && (
                <>
                  <dt>Entrega</dt>
                  <dd>
                    {ENTREGA[p.entrega] || p.entrega}
                    {p.direccion && `: ${p.direccion}, ${p.comuna}, ${p.region}`}
                    {p.rut && ` · RUT ${p.rut}`}
                  </dd>
                </>
              )}
              {p.notas && (
                <>
                  <dt>Notas</dt>
                  <dd>{p.notas}</dd>
                </>
              )}
              <dt>Pago Mercado Pago</dt>
              <dd>{p.mp_pago_id ? `N° ${p.mp_pago_id} (${p.mp_estado_detalle || p.estado})` : 'Sin pago registrado'}</dd>
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}

// ---------- Clientes ----------

function Clientes({ pedidos }) {
  const [busca, setBusca] = useState('');
  const [soloPagados, setSoloPagados] = useState(true);

  const clientes = useMemo(() => {
    const m = new Map();
    for (const p of pedidos) {
      if (soloPagados && !PAGADOS.has(p.estado)) continue;
      const k = p.correo.toLowerCase();
      const c = m.get(k) || { correo: k, nombre: p.nombre, telefono: p.telefono, empresa: p.empresa, compras: 0, total: 0, productos: new Set(), ultima: p.creado_en };
      if (PAGADOS.has(p.estado)) {
        c.compras += 1;
        c.total += p.total;
      }
      c.productos.add(p.producto_nombre);
      if (p.creado_en > c.ultima) c.ultima = p.creado_en;
      c.telefono ||= p.telefono;
      c.empresa ||= p.empresa;
      m.set(k, c);
    }
    return [...m.values()].sort((a, b) => b.total - a.total || (b.ultima > a.ultima ? 1 : -1));
  }, [pedidos, soloPagados]);

  const q = busca.trim().toLowerCase();
  const lista = q ? clientes.filter((c) => `${c.nombre} ${c.correo} ${c.empresa || ''}`.toLowerCase().includes(q)) : clientes;

  function exportar() {
    const filas = [['Nombre', 'Correo', 'Teléfono', 'Empresa', 'Compras pagadas', 'Total pagado', 'Productos', 'Última compra']];
    for (const c of lista) filas.push([c.nombre, c.correo, c.telefono || '', c.empresa || '', c.compras, c.total, [...c.productos].join(' / '), fecha(c.ultima)]);
    const csv = filas.map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `clientes-nicopacheco-${dia(new Date().toISOString())}.csv`;
    a.click();
  }

  return (
    <div className="adm-seccion">
      <div className="adm-barra">
        <input className="adm-buscar" placeholder="Buscar por nombre, correo o empresa" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <label className="adm-check">
          <input type="checkbox" checked={soloPagados} onChange={(e) => setSoloPagados(e.target.checked)} /> Solo quienes pagaron
        </label>
        <button type="button" className="adm-btn adm-btn-linea" onClick={exportar} disabled={!lista.length}>
          Descargar Excel (CSV)
        </button>
      </div>
      {!lista.length ? (
        <p className="adm-vacio">Todavía no hay clientes en este período.</p>
      ) : (
        <div className="adm-tabla-caja">
          <table className="adm-tabla">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Compró</th>
                <th className="der">Compras</th>
                <th className="der">Total</th>
                <th>Última</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.correo}>
                  <td>
                    <strong>{c.nombre}</strong>
                    <small>
                      {c.correo}
                      {c.empresa ? ` · ${c.empresa}` : ''}
                    </small>
                  </td>
                  <td>{c.telefono ? <a href={`https://wa.me/${c.telefono.replace(/\D/g, '')}`}>{c.telefono}</a> : '—'}</td>
                  <td>{[...c.productos].join(', ')}</td>
                  <td className="der">{c.compras}</td>
                  <td className="der">{pesos(c.total)}</td>
                  <td>{fecha(c.ultima)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Programas y precios ----------

const CAMPOS = [
  ['nombre', 'Nombre', 'texto'],
  ['titulo_corto', 'Título en el mosaico', 'texto', (p) => p.tipo === 'servicio' && !p.padre],
  ['etiqueta', 'Etiqueta', 'texto', (p) => p.tipo !== 'planilla' && !p.padre],
  ['resena', 'Reseña', 'largo'],
  ['importancia', 'Por qué importa', 'largo', (p) => p.tipo === 'servicio' && !p.padre],
  ['precio', 'Precio (solo números)', 'numero'],
  ['precio_anterior', 'Precio anterior, tachado (opcional)', 'numero', (p) => p.tipo === 'libro'],
  ['precio_texto', 'Texto del precio (opcional, reemplaza al número)', 'texto'],
  ['accion', 'Texto del botón', 'texto', (p) => p.tipo !== 'libro'],
  ['orden', 'Orden', 'numero'],
];

function Programas({ productos, onCambio }) {
  const [editando, setEditando] = useState(null);
  const grupos = [
    ['servicio', 'Programas y servicios'],
    ['libro', 'Libro Franquicia Justa'],
    ['planilla', 'Planillas'],
  ];
  return (
    <div className="adm-seccion">
      <p className="adm-ayuda">Los cambios se ven en el sitio en aproximadamente un minuto.</p>
      {grupos.map(([tipo, titulo]) => (
        <section key={tipo} className="adm-panel">
          <h3>{titulo}</h3>
          <ul className="adm-productos">
            {productos
              .filter((p) => p.tipo === tipo)
              .map((p) => (
                <li key={p.id} className={p.activo ? '' : 'inactivo'}>
                  {editando === p.id ? (
                    <EditorProducto
                      p={p}
                      cerrar={() => setEditando(null)}
                      guardado={() => {
                        setEditando(null);
                        onCambio();
                      }}
                    />
                  ) : (
                    <button type="button" className="adm-producto" onClick={() => setEditando(p.id)}>
                      <span>
                        <strong>{p.nombre}</strong>
                        <small>
                          {p.padre ? 'Opción de Mentoring · ' : ''}
                          {p.pago_online ? 'Pago en línea' : p.tipo === 'planilla' ? 'Venta por WhatsApp' : 'Por cotización'}
                          {!p.activo && ' · Oculto'}
                        </small>
                      </span>
                      <span className="adm-producto-precio">{p.precio_texto || (p.precio != null ? pesos(p.precio) : 'A cotizar')}</span>
                      <span className="adm-editar">Editar</span>
                    </button>
                  )}
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function EditorProducto({ p, cerrar, guardado }) {
  const [v, setV] = useState(p);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const set = (k, val) => setV((x) => ({ ...x, [k]: val }));

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    const cambios = {};
    for (const [k, , tipo] of CAMPOS) {
      let val = v[k];
      if (tipo === 'numero') val = val === '' || val == null ? null : Math.round(Number(val));
      else val = typeof val === 'string' ? val.trim() || null : val;
      cambios[k] = val;
    }
    cambios.nombre ||= p.nombre;
    cambios.orden ??= p.orden;
    cambios.pago_online = !!v.pago_online;
    cambios.activo = !!v.activo;
    cambios.actualizado_en = new Date().toISOString();
    if (cambios.pago_online && cambios.precio == null) {
      setError('Para cobrar en línea, el producto necesita un precio.');
      setGuardando(false);
      return;
    }
    const { error } = await supabase.from('productos').update(cambios).eq('id', p.id);
    setGuardando(false);
    if (error) setError(error.message);
    else guardado();
  }

  return (
    <form className="adm-editor" onSubmit={guardar}>
      <div className="adm-editor-campos">
        {CAMPOS.filter(([, , , cond]) => !cond || cond(p)).map(([k, etiqueta, tipo]) => (
          <label key={k} className={tipo === 'largo' ? 'ancho' : ''}>
            <span>{etiqueta}</span>
            {tipo === 'largo' ? (
              <textarea rows={3} value={v[k] ?? ''} onChange={(e) => set(k, e.target.value)} />
            ) : (
              <input
                type={tipo === 'numero' ? 'number' : 'text'}
                min={tipo === 'numero' ? 0 : undefined}
                value={v[k] ?? ''}
                onChange={(e) => set(k, e.target.value)}
              />
            )}
          </label>
        ))}
      </div>
      <div className="adm-editor-checks">
        {p.tipo !== 'libro' && (
          <label className="adm-check">
            <input type="checkbox" checked={!!v.pago_online} onChange={(e) => set('pago_online', e.target.checked)} /> Cobrar en línea con
            Mercado Pago
          </label>
        )}
        <label className="adm-check">
          <input type="checkbox" checked={!!v.activo} onChange={(e) => set('activo', e.target.checked)} /> Visible en el sitio
        </label>
      </div>
      {error && <p className="adm-error">{error}</p>}
      <div className="adm-editor-botones">
        <button type="submit" className="adm-btn" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button type="button" className="adm-btn adm-btn-linea" onClick={cerrar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ---------- Códigos de descuento ----------

function Codigos({ codigos, productos, onCambio }) {
  const vacio = { codigo: '', tipo: 'porcentaje', valor: '', aplica_a: 'todo', usos_max: '', vence: '', nota: '' };
  const [nuevo, setNuevo] = useState(vacio);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);
  const set = (k, val) => setNuevo((x) => ({ ...x, [k]: val }));

  const opcionesAplica = [
    ['todo', 'Todo el sitio'],
    ['libro', 'Solo el libro'],
    ['servicios', 'Solo programas'],
    ...productos.filter((p) => p.pago_online).map((p) => [p.id, p.nombre]),
  ];
  const nombreAplica = (a) => opcionesAplica.find(([k]) => k === a)?.[1] || a;

  async function crear(e) {
    e.preventDefault();
    setError('');
    const codigo = nuevo.codigo.trim().toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z0-9_-]{3,30}$/.test(codigo)) return setError('El código debe tener entre 3 y 30 letras o números, sin espacios.');
    const valor = Math.round(Number(nuevo.valor));
    if (!valor || valor < 1) return setError('Indica el valor del descuento.');
    if (nuevo.tipo === 'porcentaje' && valor > 100) return setError('Un porcentaje no puede ser mayor a 100.');
    setCreando(true);
    const { error } = await supabase.from('codigos_descuento').insert({
      codigo,
      tipo: nuevo.tipo,
      valor,
      aplica_a: nuevo.aplica_a,
      usos_max: nuevo.usos_max ? Math.round(Number(nuevo.usos_max)) : null,
      vence: nuevo.vence || null,
      nota: nuevo.nota.trim() || null,
    });
    setCreando(false);
    if (error) setError(error.code === '23505' ? 'Ya existe un código con ese nombre.' : error.message);
    else {
      setNuevo(vacio);
      onCambio();
    }
  }

  async function alternar(c) {
    const { error } = await supabase.from('codigos_descuento').update({ activo: !c.activo }).eq('codigo', c.codigo);
    if (error) alertar(error.message);
    else onCambio();
  }

  return (
    <div className="adm-seccion">
      <section className="adm-panel">
        <h3>Crear código</h3>
        <form className="adm-codigo-form" onSubmit={crear}>
          <label>
            <span>Código</span>
            <input value={nuevo.codigo} onChange={(e) => set('codigo', e.target.value.toUpperCase())} placeholder="LANZAMIENTO20" />
          </label>
          <label>
            <span>Tipo</span>
            <select value={nuevo.tipo} onChange={(e) => set('tipo', e.target.value)}>
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="monto">Monto fijo ($)</option>
            </select>
          </label>
          <label>
            <span>{nuevo.tipo === 'porcentaje' ? 'Descuento (%)' : 'Descuento ($)'}</span>
            <input type="number" min="1" value={nuevo.valor} onChange={(e) => set('valor', e.target.value)} />
          </label>
          <label>
            <span>Aplica a</span>
            <select value={nuevo.aplica_a} onChange={(e) => set('aplica_a', e.target.value)}>
              {opcionesAplica.map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Máximo de usos (opcional)</span>
            <input type="number" min="1" value={nuevo.usos_max} onChange={(e) => set('usos_max', e.target.value)} />
          </label>
          <label>
            <span>Vence (opcional)</span>
            <input type="date" value={nuevo.vence} onChange={(e) => set('vence', e.target.value)} />
          </label>
          <label className="ancho">
            <span>Nota interna (opcional)</span>
            <input value={nuevo.nota} onChange={(e) => set('nota', e.target.value)} placeholder="Ej.: seminario de marzo" />
          </label>
          {error && <p className="adm-error ancho">{error}</p>}
          <button type="submit" className="adm-btn" disabled={creando}>
            {creando ? 'Creando…' : 'Crear código'}
          </button>
        </form>
      </section>

      <section className="adm-panel">
        <h3>Códigos creados</h3>
        {!codigos.length ? (
          <p className="adm-vacio">Aún no hay códigos. Crea el primero arriba.</p>
        ) : (
          <div className="adm-tabla-caja">
            <table className="adm-tabla">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descuento</th>
                  <th>Aplica a</th>
                  <th className="der">Usos</th>
                  <th>Vence</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {codigos.map((c) => (
                  <tr key={c.codigo} className={c.activo ? '' : 'inactivo'}>
                    <td>
                      <strong className="adm-codigo">{c.codigo}</strong>
                      {c.nota && <small>{c.nota}</small>}
                    </td>
                    <td>{c.tipo === 'porcentaje' ? `${c.valor}%` : pesos(c.valor)}</td>
                    <td>{nombreAplica(c.aplica_a)}</td>
                    <td className="der">
                      {c.usos}
                      {c.usos_max ? ` / ${c.usos_max}` : ''}
                    </td>
                    <td>{c.vence ? fecha(`${c.vence}T12:00:00`) : 'Sin vencimiento'}</td>
                    <td>
                      <button type="button" className={c.activo ? 'adm-pill on' : 'adm-pill'} onClick={() => alternar(c)}>
                        {c.activo ? 'Activo' : 'Pausado'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function alertar(m) {
  console.error(m);
  window.dispatchEvent(new CustomEvent('adm-error', { detail: m }));
}

// ---------- Panel ----------

const PESTANAS = [
  ['resumen', 'Resumen'],
  ['pedidos', 'Pedidos'],
  ['clientes', 'Clientes'],
  ['programas', 'Programas y precios'],
  ['codigos', 'Códigos de descuento'],
  ['certificados', 'Certificados'],
];

function Panel({ sesion }) {
  const [pestana, setPestana] = useState('resumen');
  const [dias, setDias] = useState(30);
  const [datos, setDatos] = useState(null);
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(async () => {
    const desde = new Date(Date.now() - dias * 864e5).toISOString();
    const [prod, cod, ped, vis, tie] = await Promise.all([
      supabase.from('productos').select('*').order('tipo').order('orden'),
      supabase.from('codigos_descuento').select('*').order('creado_en', { ascending: false }),
      supabase.from('pedidos').select('*').gte('creado_en', desde).order('creado_en', { ascending: false }).limit(5000),
      supabase.from('visitas').select('creado_en,visitante,sesion,ruta,referente,fuente,dispositivo,pais').gte('creado_en', desde).limit(50000),
      supabase.from('tiempos_seccion').select('sesion,seccion,segundos').gte('creado_en', desde).limit(50000),
    ]);
    const err = [prod, cod, ped, vis, tie].find((r) => r.error)?.error;
    if (err) setAviso(`No pudimos cargar algunos datos: ${err.message}`);
    setDatos({
      productos: prod.data || [],
      codigos: cod.data || [],
      pedidos: ped.data || [],
      visitas: vis.data || [],
      tiempos: tie.data || [],
    });
  }, [dias]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const f = (e) => setAviso(e.detail);
    window.addEventListener('adm-error', f);
    return () => window.removeEventListener('adm-error', f);
  }, []);

  return (
    <div className="adm">
      <header className="adm-cabecera">
        <div className="adm-cabecera-fila">
          <a href="/" className="adm-marca">
            NICO PACHECO®
          </a>
          <span className="adm-quien">{sesion.user.email}</span>
          <button type="button" className="adm-salir" onClick={() => window.dispatchEvent(new Event('adm-clave'))}>
            Mi clave
          </button>
          <button type="button" className="adm-salir" onClick={() => supabase.auth.signOut()}>
            Salir
          </button>
        </div>
        <nav className="adm-pestanas" aria-label="Secciones del panel">
          {PESTANAS.map(([k, n]) => (
            <button key={k} type="button" className={pestana === k ? 'activa' : ''} onClick={() => setPestana(k)} aria-current={pestana === k ? 'page' : undefined}>
              {n}
            </button>
          ))}
        </nav>
      </header>

      <main className="adm-contenido">
        <div className="adm-titulo-fila">
          <h1>{PESTANAS.find(([k]) => k === pestana)[1]}</h1>
          {['resumen', 'pedidos', 'clientes'].includes(pestana) && (
            <label className="adm-periodo">
              Período{' '}
              <select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
                <option value={7}>Últimos 7 días</option>
                <option value={30}>Últimos 30 días</option>
                <option value={90}>Últimos 90 días</option>
                <option value={365}>Último año</option>
              </select>
            </label>
          )}
        </div>
        {aviso && (
          <p className="adm-error" role="alert">
            {aviso}{' '}
            <button type="button" onClick={() => setAviso('')}>
              Cerrar
            </button>
          </p>
        )}
        {!datos ? (
          <p className="adm-vacio">Cargando…</p>
        ) : pestana === 'resumen' ? (
          <Resumen {...datos} dias={dias} />
        ) : pestana === 'pedidos' ? (
          <Pedidos pedidos={datos.pedidos} onCambio={cargar} />
        ) : pestana === 'clientes' ? (
          <Clientes pedidos={datos.pedidos} />
        ) : pestana === 'programas' ? (
          <Programas productos={datos.productos} onCambio={cargar} />
        ) : pestana === 'certificados' ? (
          <Certificados token={sesion.access_token} />
        ) : (
          <Codigos codigos={datos.codigos} productos={datos.productos} onCambio={cargar} />
        )}
      </main>
    </div>
  );
}

export default function Admin() {
  const [sesion, setSesion] = useState(undefined);
  const [cambiarClave, setCambiarClave] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session));
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      setSesion(s);
      if (evento === 'PASSWORD_RECOVERY') setCambiarClave(true);
    });
    const f = () => setCambiarClave(true);
    window.addEventListener('adm-clave', f);
    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener('adm-clave', f);
    };
  }, []);

  if (sesion === undefined) return <main className="adm-acceso"><p className="adm-vacio">Cargando…</p></main>;
  if (!sesion) return <Acceso />;
  if (sesion.user.email?.toLowerCase() !== ADMIN) {
    return (
      <main className="adm-acceso">
        <div className="adm-acceso-caja">
          <h1>Sin acceso</h1>
          <p>La cuenta {sesion.user.email} no tiene acceso al panel.</p>
          <button type="button" className="adm-btn" onClick={() => supabase.auth.signOut()}>
            Salir
          </button>
        </div>
      </main>
    );
  }
  if (cambiarClave) {
    return <CrearClave alListo={() => setCambiarClave(false)} alCancelar={() => setCambiarClave(false)} />;
  }
  return <Panel sesion={sesion} />;
}
