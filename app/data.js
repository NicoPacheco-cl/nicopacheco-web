// Contenido del sitio. Edita precios y textos aquí.

export const nav = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#tienda', label: 'Tienda' },
  { href: '#conferencias', label: 'Conferencias y seminarios' },
  { href: '#podcast', label: 'Podcast' },
  { href: '#sobre-mi', label: 'Sobre mí' },
];

export const medios = [
  'Diario Financiero',
  'TVN',
  'Radio La Clave 92.9',
  'El Conquistador FM',
  'Programa Sabores',
];

export const cifras = [
  { valor: '+100', texto: 'pymes asesoradas en Chile' },
  { valor: '7', texto: 'empresas donde soy director' },
  { valor: '14', texto: 'franquicias en la cadena que dirigí' },
  { valor: '+50', texto: 'conferencias en 10 años' },
];

// Casos reales del CV. "antes" vacío = no hay cifra de partida publicable.
export const resultados = [
  {
    empresa: 'Kingdom Food',
    rubro: 'Gastronomía',
    indicador: 'Ventas mensuales',
    antes: '500 UF',
    despues: '1.500 UF',
    plazo: '12 meses',
  },
  {
    empresa: 'Hotel Millahue',
    rubro: 'Hotelería',
    indicador: 'Margen EBITDA',
    antes: '−5%',
    despues: '12%',
    plazo: '8 meses',
  },
  {
    empresa: 'Pacific Rental',
    rubro: 'Turismo',
    indicador: 'Negocios en operación',
    antes: '1 hostal',
    despues: '5 negocios',
    plazo: '2 años',
  },
  {
    empresa: 'Mammaterra',
    rubro: 'Comida rápida saludable',
    indicador: 'Red de locales',
    antes: '',
    despues: '14 franquicias',
    plazo: '5 años',
  },
  {
    empresa: 'Mammaterra',
    rubro: 'Comida rápida saludable',
    indicador: 'Valorización de mercado',
    antes: '',
    despues: 'USD 12 MM',
    plazo: '2020',
  },
];

export const servicios = [
  {
    id: 'ganar-mas',
    necesidad: 'Quiero que mi negocio gane más',
    items: [
      {
        id: 'diagnostico',
        nombre: 'Diagnóstico Pyme',
        detalle:
          'Una sesión para revisar tu estado de resultados, flujo de caja y modelo de negocio, y un informe con las prioridades para los próximos 90 días.',
        precio: '$149.990',
        accion: 'Agendar diagnóstico',
      },
      {
        id: 'mentoring',
        nombre: 'Mentoring para dueños y gerentes',
        detalle:
          'Sesiones uno a uno sobre propuesta de valor, estudio de mercado, finanzas y gestión directiva.',
        precio: '$90.000 la hora\n$320.000 pack de 4 horas',
        accion: 'Agendar mentoring',
      },
      {
        id: 'directorio-pyme',
        nombre: 'Directorio PYME',
        detalle:
          'Un directorio externo para tu empresa: seguimiento mensual de metas, números y decisiones, para pasar de emprendimiento a compañía sólida.',
        precio: 'A cotizar',
        accion: 'Pedir cotización',
      },
    ],
  },
  {
    id: 'vender',
    necesidad: 'Quiero valorizar o vender mi negocio',
    items: [
      {
        id: 'valorizacion',
        nombre: 'Valorización de empresa',
        detalle:
          'Cuánto vale tu negocio hoy, con el mismo método que usamos en Portal Comercios. Ideal antes de vender, buscar socio o pedir financiamiento.',
        precio: '$99.990',
        accion: 'Valorizar mi negocio',
      },
      {
        id: 'derecho-de-llave',
        nombre: 'Venta de derechos de llave',
        detalle:
          'Te acompaño desde el precio hasta el cierre: preparación del negocio, búsqueda de compradores y negociación.',
        precio: 'Desde $490.000 + comisión de éxito',
        accion: 'Pedir cotización',
      },
    ],
  },
  {
    id: 'franquiciar',
    necesidad: 'Quiero franquiciar mi marca',
    items: [
      {
        id: 'franquicias',
        nombre: 'Asesoría en franquicias',
        detalle:
          'Modelo de franquicia, manuales, contrato y plan de expansión, desde la experiencia de llevar una cadena a 14 franquicias.',
        precio: 'Desde $2.500.000 por proyecto',
        accion: 'Pedir cotización',
      },
      {
        id: 'libro',
        nombre: 'Libro Franquicia Justa',
        detalle: 'Lo que tiene que saber un franquiciador y un franquiciado antes de firmar.',
        precio: 'Desde $14.990',
        accion: 'Ver en la tienda',
        href: '#tienda',
      },
    ],
  },
];

export const tienda = [
  {
    id: 'planilla',
    nombre: 'Planilla financiera',
    detalle: 'Estado de resultados, flujo de caja o costeo gastronómico. Lista para usar en Excel o Google Sheets.',
    precio: '$19.990',
  },
  {
    id: 'pack-planillas',
    nombre: 'Pack completo de planillas',
    detalle: 'Las tres planillas, con guía de uso para tu negocio.',
    precio: '$49.990',
  },
  {
    id: 'libro-digital',
    nombre: 'Franquicia Justa, libro digital',
    detalle: 'Formato PDF para leer en cualquier dispositivo.',
    precio: '$14.990',
  },
  {
    id: 'libro-impreso',
    nombre: 'Franquicia Justa, libro impreso',
    detalle: 'Envío a todo Chile.',
    precio: '$24.990 + envío',
  },
];

export const charlas = [
  {
    titulo: 'Motivación y liderazgo',
    detalle:
      'Cómo pasar de la idea al plan y del plan a los resultados, con historias reales de negocios que se levantaron.',
  },
  {
    titulo: 'Innovación y emprendimiento',
    detalle:
      'Modelos de negocio, propuesta de valor y cómo hacer crecer una empresa en mercados regionales y de Latinoamérica.',
  },
];

export const entradas = [
  { tipo: 'Preventa', precio: '$39.990' },
  { tipo: 'General', precio: '$59.990' },
  { tipo: 'VIP', precio: '$99.990', nota: 'con sesión grupal' },
];

export const trayectoria = [
  { periodo: '2012–2015', cargo: 'Gerente comercial', lugar: 'Hotel Millahue' },
  { periodo: '2015–2017', cargo: 'Gerente general', lugar: 'Inversiones Pacific Rental' },
  { periodo: '2017–2022', cargo: 'CEO y líder de expansión de franquicias', lugar: 'Inversiones Mammaterra' },
  { periodo: '2019–hoy', cargo: 'Secretario ejecutivo y director de empresas', lugar: 'Fair Consulting' },
  { periodo: '2023–hoy', cargo: 'Director comercial', lugar: 'Kingdom Food' },
  { periodo: '2025–hoy', cargo: 'Columnista de emprendimiento e innovación', lugar: 'Diario El Llanquihue' },
  { periodo: '2025–hoy', cargo: 'Director ejecutivo', lugar: 'Plan Innova, Puerto Montt' },
];

export const prensa = [
  {
    src: '/fotos/medios/prensa-mammaterra-franquicias.jpg',
    w: 750,
    h: 750,
    medio: 'Diario Financiero, 2019',
    alt: 'Nota de prensa sobre la expansión de Mammaterra en franquicias',
  },
  {
    src: '/fotos/medios/tv-hacedor-de-hambre-mammaterra.jpg',
    w: 1080,
    h: 1080,
    medio: 'TVN, Hacedor de Hambre',
    alt: 'Grabación del programa Hacedor de Hambre en un local Mammaterra',
  },
  {
    src: '/fotos/medios/radio-la-clave.jpg',
    w: 1800,
    h: 1013,
    medio: 'Radio La Clave 92.9',
    alt: 'Entrevista en Radio La Clave 92.9',
  },
  {
    src: '/fotos/medios/radio-el-conquistador.jpg',
    w: 720,
    h: 960,
    medio: 'El Conquistador FM',
    alt: 'Nico Pacheco en el estudio de El Conquistador FM',
  },
  {
    src: '/fotos/medios/tv-sabores.jpg',
    w: 1080,
    h: 1080,
    medio: 'Programa Sabores',
    alt: 'En el set del programa Sabores',
  },
];

export const intereses = [
  { value: 'diagnostico', label: 'Diagnóstico Pyme' },
  { value: 'mentoring', label: 'Mentoring' },
  { value: 'directorio-pyme', label: 'Directorio PYME' },
  { value: 'valorizacion', label: 'Valorización de empresa' },
  { value: 'derecho-de-llave', label: 'Venta de derechos de llave' },
  { value: 'franquicias', label: 'Asesoría en franquicias' },
  { value: 'planilla', label: 'Planillas financieras' },
  { value: 'planilla-gratis', label: 'Planilla de flujo de caja gratis' },
  { value: 'libro', label: 'Libro Franquicia Justa' },
  { value: 'conferencia', label: 'Conferencia para mi empresa o evento' },
  { value: 'seminario', label: 'Entradas a seminarios' },
  { value: 'podcast', label: 'Podcast EmprendeBien' },
  { value: 'otro', label: 'Otro tema' },
];

export const CORREO = 'nikolaspacheco@gmail.com';
export const WHATSAPP = '56990871663';
export const wa = (texto) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;

export const LINKEDIN = 'https://www.linkedin.com/in/maximiliano-pacheco-o/';
