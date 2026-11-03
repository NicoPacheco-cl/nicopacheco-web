// Contenido del sitio. Edita precios y textos aquí.

export const nav = [
  { href: '#sobre-mi', label: 'Sobre mí' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#tienda', label: 'Tienda' },
  { href: '#podcast', label: 'Podcast' },
  { href: '#libro', label: 'Libro' },
];

// Respaldo discreto bajo la portada
export const cifras = [
  { valor: '+50', texto: 'pymes asesoradas' },
  { valor: '14', texto: 'franquicias creadas' },
  { valor: '7', texto: 'empresas donde soy CEO' },
  { valor: '1', texto: 'compañía valorada en USD 12,5 MM' },
  { valor: '+50', texto: 'conferencias en 10 años' },
  { valor: 'Autor', texto: 'del libro “Franquicia Justa”' },
];

// Problemas típicos del visitante y qué servicio los resuelve
export const problemas = [
  {
    frase: 'Vendo bien, pero a fin de mes no queda plata.',
    respuesta: 'Ordenamos tu estado de resultados y tu flujo de caja para encontrar dónde se va el margen.',
    href: '#diagnostico',
    accion: 'Ver Diagnóstico Modelo de Negocio',
  },
  {
    frase: 'No sé cuánto vale mi negocio.',
    respuesta: 'Calculamos su valor con un método claro, para negociar con números y no a ojo.',
    href: '#valorizacion-pyme',
    accion: 'Ver Valorización Pyme',
  },
  {
    frase: 'Quiero vender mi local y no sé por dónde partir.',
    respuesta: 'Te acompaño en la venta del derecho de llave, desde el precio hasta la firma.',
    href: '#derecho-de-llave',
    accion: 'Ver venta de derechos de llave',
  },
  {
    frase: 'Mi marca funciona y quiero replicarla.',
    respuesta: 'Evaluamos si tu negocio es franquiciable y armamos el modelo para crecer con socios.',
    href: '#franquicias',
    accion: 'Ver asesoría en franquicias',
  },
];

export const servicios = [
  {
    id: 'ganar-mas',
    necesidad: 'Quiero que mi negocio gane más',
    items: [
      {
        id: 'diagnostico',
        mosaico: { titulo: 'Diagnóstico Modelo de Negocio', etiqueta: 'Diagnóstico', fondo: '#123a2c', marca: '2 SESIONES' },
        nombre: 'Diagnóstico Modelo de Negocio',
        resena:
          'Un estudio completo de tu negocio en dos reuniones de 90 a 120 minutos cada una. En la primera analizamos a fondo cómo está funcionando tu empresa y en la segunda te presento un informe con su estado real, los principales problemas y las estrategias para revertir la situación.',
        importancia:
          'La mayoría de las pymes no tiene un problema de ventas, sino de números que nadie mira. Este es el punto de partida.',
        precio: '$149.990',
        accion: 'Agendar diagnóstico',
        destacado: true,
      },
      {
        id: 'mentoring',
        mosaico: { titulo: 'Mentoring', etiqueta: 'Asesoría 1 a 1', fondo: '#0f2a6b', marca: '1 A 1' },
        nombre: 'Mentoring para dueños y gerentes',
        resena:
          'Sesiones uno a uno para trabajar tu propuesta de valor, tu modelo de negocio, tus finanzas y la gestión de tu equipo, con tareas concretas entre una sesión y otra.',
        importancia:
          'Decidir solo es lo más difícil de tener una empresa. Un mentor con experiencia acorta el camino y evita errores caros.',
        precio: '$90.000 la hora, o $320.000 el pack de 4 horas',
        accion: 'Agendar mentoring',
      },
      {
        id: 'directorio-pyme',
        mosaico: { titulo: 'Directorio PYME', etiqueta: 'Gobierno corporativo', fondo: '#2a2a2a', marca: 'DIRECTORIO' },
        nombre: 'Directorio PYME',
        resena:
          'Un directorio externo para tu empresa: una reunión mensual para revisar metas, números y decisiones clave, como en las grandes compañías.',
        importancia:
          'Es lo que transforma un emprendimiento que depende de su dueño en una empresa sólida y sostenible.',
        precio: 'A cotizar según tamaño de la empresa',
        accion: 'Pedir cotización',
      },
    ],
  },
  {
    id: 'vender',
    necesidad: 'Quiero valorizar o vender mi negocio',
    items: [
      {
        id: 'valorizacion-pyme',
        mosaico: { titulo: 'Valorización Pyme', etiqueta: 'En línea', fondo: '#3e6f8a', marca: 'CERTIFICADO' },
        nombre: 'Valorización Pyme',
        resena:
          'Responde paso a paso sobre tu negocio y calcula gratis una primera estimación de cuánto vale. Si lo necesitas, pide un certificado en PDF con folio, el detalle del cálculo y lo que puedes mejorar para que valga más.',
        importancia:
          'El sobreprecio es la razón N° 1 por la que un negocio no se vende. Con un valor de referencia pones un precio que puedas demostrar.',
        precio: 'Estimación gratis. Certificado desde $50.000',
        accion: 'Valorizar mi negocio',
        destacado: true,
      },
      {
        id: 'derecho-de-llave',
        mosaico: { titulo: 'Derechos de llave', etiqueta: 'Compraventa', fondo: '#151b2b', marca: 'LLAVE' },
        nombre: 'Venta de derechos de llave',
        resena:
          'Preparo tu negocio para la venta, fijamos un precio defendible, buscamos compradores y te acompaño en la negociación hasta el cierre.',
        importancia:
          'Un local bien presentado y con números ordenados se vende más rápido y a mejor precio.',
        precio: 'Desde $490.000 más comisión de éxito',
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
        mosaico: { titulo: 'Franquicias', etiqueta: 'Expansión', fondo: '#4a4a4a', marca: 'FRANQUICIA' },
        nombre: 'Asesoría en franquicias',
        resena:
          'Evaluamos si tu negocio es franquiciable y construimos el modelo completo: números del franquiciado, manuales de operación, contrato y plan de expansión.',
        importancia:
          'Una franquicia mal diseñada quema la marca y a los socios. Bien hecha, es la forma más rápida de crecer sin poner todo el capital.',
        precio: 'Desde $2.500.000 por proyecto',
        accion: 'Pedir cotización',
        destacado: true,
      },
      {
        id: 'libro',
        nombre: 'Libro Franquicia Justa',
        resena:
          'Una guía práctica sobre cómo funciona una franquicia por dentro: qué se paga, qué se recibe y cómo se construye una relación sana entre marca y franquiciado.',
        importancia:
          'Si vas a comprar o a ofrecer una franquicia, conviene leerlo antes de firmar.',
        precio: 'Desde $7.990',
        accion: 'Ver el libro',
        href: '#tienda',
      },
    ],
  },
];

// Detalle ampliado de cada servicio, por id. Se muestra en su ventana de detalle.
// Cuando tengas los archivos, completa testimonio.video e informe.href.
export const fichas = {
  'valorizacion-pyme': { href: '/valoriza', directo: true },
  diagnostico: {
    sesiones: [
      {
        titulo: 'Radiografía del negocio',
        duracion: '90 a 120 minutos',
        bajada: 'Estudiamos tu empresa por dentro para identificar su estado actual.',
        puntos: [
          'La venta y sus canales',
          'La compra y las distintas familias de costos',
          'Las cuentas contables y el costo operativo del negocio',
          'El EBITDA, para ver cuánto genera realmente la operación',
          'El modelo de negocio',
        ],
      },
      {
        titulo: 'Diagnóstico y estrategia',
        duracion: '90 a 120 minutos',
        bajada: 'Te presento el diagnóstico de la empresa en un informe completo del negocio.',
        puntos: [
          'Estado de resultados de los últimos 3 meses',
          'Proforma financiera de la industria',
          'Los principales problemas detectados',
          'Las sugerencias y estrategias más apropiadas para revertir la situación',
        ],
      },
    ],
    testimonio: { rotulo: 'Video testimonial de prueba', video: '' },
    informe: { etiqueta: 'Ver informe de diagnóstico de prueba', href: '' },
  },
};

export const pasos = [
  {
    titulo: 'Conversamos',
    texto: 'Me cuentas en qué está tu negocio y qué quieres lograr. Te digo con honestidad si te puedo ayudar.',
  },
  {
    titulo: 'Diagnóstico y plan',
    texto: 'Revisamos tus números y definimos un plan concreto, con prioridades y plazos.',
  },
  {
    titulo: 'Acompañamiento',
    texto: 'Trabajamos juntos el plan, con seguimiento hasta que los resultados se vean en tus números.',
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
    detalle: 'Las tres planillas, con una guía de uso para tu negocio.',
    precio: '$49.990',
  },
  {
    id: 'libro-digital',
    nombre: 'Franquicia Justa, libro digital',
    detalle: 'Kindle, Apple Books y PDF, con descarga inmediata.',
    precio: '$7.990',
  },
  {
    id: 'libro-impreso',
    nombre: 'Franquicia Justa, libro impreso',
    detalle: 'Preventa con despacho a todo Chile o retiro gratis.',
    precio: '$14.990',
  },
];

export const charlas = [
  {
    titulo: 'Motivación y liderazgo',
    detalle:
      'Para equipos que necesitan pasar de la idea al plan y del plan a los resultados, con historias reales de negocios que se levantaron.',
  },
  {
    titulo: 'Innovación y emprendimiento',
    detalle:
      'Para emprendedores, estudiantes y gremios: modelos de negocio, propuesta de valor y cómo crecer desde regiones.',
  },
];

export const entradas = [
  { tipo: 'Preventa', precio: '$39.990' },
  { tipo: 'General', precio: '$59.990' },
  { tipo: 'VIP', precio: '$99.990', nota: 'con sesión grupal' },
];

export const trayectoria = [
  { periodo: '2025–hoy', cargo: 'Director ejecutivo', lugar: 'Plan Innova, Puerto Montt' },
  { periodo: '2025–hoy', cargo: 'Columnista de emprendimiento e innovación', lugar: 'Diario El Llanquihue' },
  { periodo: '2023–hoy', cargo: 'Director comercial', lugar: 'Kingdom Food' },
  { periodo: '2019–hoy', cargo: 'Secretario ejecutivo y director de empresas', lugar: 'Fair Consulting' },
  { periodo: '2017–2022', cargo: 'CEO y líder de expansión de franquicias', lugar: 'Inversiones Mammaterra' },
  { periodo: '2015–2017', cargo: 'Gerente general', lugar: 'Inversiones Pacific Rental' },
  { periodo: '2012–2015', cargo: 'Gerente comercial', lugar: 'Hotel Millahue' },
];

export const medios = [
  'Diario Financiero',
  'TVN',
  'Radio La Clave 92.9',
  'El Conquistador FM',
  'Programa Sabores',
];

export const intereses = [
  { value: 'diagnostico', label: 'Diagnóstico Modelo de Negocio' },
  { value: 'mentoring', label: 'Mentoring' },
  { value: 'directorio-pyme', label: 'Directorio PYME' },
  { value: 'valorizacion-pyme', label: 'Valorización Pyme' },
  { value: 'derecho-de-llave', label: 'Venta de derechos de llave' },
  { value: 'franquicias', label: 'Asesoría en franquicias' },
  { value: 'planilla', label: 'Planillas financieras' },
  { value: 'planilla-gratis', label: 'Planilla de flujo de caja gratis' },
  { value: 'libro', label: 'Libro Franquicia Justa' },
  { value: 'conferencia', label: 'Conferencia para mi empresa o evento' },
  { value: 'seminario', label: 'Entradas a seminarios' },
  { value: 'podcast', label: 'Podcast EmprendeBien' },
  { value: 'boletin', label: 'Suscribirme a La Bitácora Pyme' },
  { value: 'otro', label: 'Otro tema' },
];

export const CORREO = 'nikolaspacheco@gmail.com';
export const WHATSAPP = '56990871663';
export const wa = (texto) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
// Pega aquí el enlace del canal cuando exista y aparecerá el botón en el sitio
export const YOUTUBE = '';
// Página de compra del libro (pago con Mercado Pago en Portal Comercios)
export const LIBRO_COMPRA = 'https://www.portalcomercios.cl/franquicias/libro';

export const LINKEDIN = 'https://www.linkedin.com/in/maximiliano-pacheco-o/';
