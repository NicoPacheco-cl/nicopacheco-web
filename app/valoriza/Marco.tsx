import "./valoriza.css";

// Cabecera y pie con la marca de nicopacheco.cl para las páginas de valorización.
export function Marco({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="cabecera">
        <div className="contenedor cabecera-fila">
          <a href="/" className="marca">NICO PACHECO<sup>®</sup></a>
          <a href="/#servicios" className="btn btn-blanco btn-chico" style={{ marginLeft: "auto" }}>Ver servicios</a>
        </div>
      </header>
      <div className="vp">{children}</div>
      <footer className="pie">
        <div className="contenedor pie-fila">
          <p className="pie-marca">NICO PACHECO®</p>
          <p className="pie-lugar">Puerto Varas, Chile</p>
        </div>
      </footer>
    </>
  );
}
