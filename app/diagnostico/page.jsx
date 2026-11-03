import Diagnostico from './Diagnostico';
import './diagnostico.css';

export const metadata = {
  title: 'Diagnóstico financiero gratis · Nico Pacheco',
  description: 'Ingresa los números de un mes y arma el estado de resultados de tu pyme. Gratis, sin registro y con descarga en PDF.',
};

export default function PaginaDiagnostico() {
  return (
    <>
      <header className="cabecera">
        <div className="contenedor cabecera-fila">
          <a href="/" className="marca">NICO PACHECO<sup>®</sup></a>
          <a href="/#servicios" className="btn btn-blanco btn-chico" style={{ marginLeft: 'auto' }}>Ver servicios</a>
        </div>
      </header>
      <main className="dp">
        <div className="dp-cont">
          <div className="dp-cab">
            <p className="rotulo">Diagnóstico financiero gratis</p>
            <h1 className="titulo">
              <span className="titulo-fuerte">SABER LOS NÚMEROS DE TU NEGOCIO NO ES IMPORTANTE,</span>{' '}
              <span className="titulo-suave">es imprescindible.</span>
            </h1>
            <p className="dp-bajada">
              Abre cada dimensión e ingresa los montos de un mes. Cada una trae cuentas de ejemplo que puedes renombrar, eliminar o complementar con las tuyas. Al final descargas tu estado de resultados en PDF.
            </p>
          </div>
          <Diagnostico />
        </div>
      </main>
      <footer className="pie">
        <div className="contenedor pie-fila">
          <p className="pie-marca">NICO PACHECO®</p>
          <p className="pie-lugar">Puerto Varas, Chile</p>
        </div>
      </footer>
    </>
  );
}
