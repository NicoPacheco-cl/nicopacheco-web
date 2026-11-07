import Diagnostico from './Diagnostico';
import Registro from './Registro';
import './diagnostico.css';

export const metadata = {
  title: 'Diagnóstico Pyme gratis · Nico Pacheco',
  description: 'Ingresa los números de un mes y arma el estado de resultados de tu pyme. Gratis y con descarga en PDF. Tus números quedan solo en tu navegador.',
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
            <h1>Diagnóstico Pyme</h1>
            <p className="dp-bajada">
              Abre cada dimensión e ingresa los montos del mes. Cada una trae cuentas de ejemplo que puedes renombrar, eliminar o complementar con las tuyas.
            </p>
          </div>
          <Registro>
            <Diagnostico />
          </Registro>
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
