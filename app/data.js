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
        precio: '$199.000',
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
        nombre: 'Derechos de llave',
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
        nombre: 'Asesoramiento integral Franquicias 360°',
        resena:
          'Evaluamos si tu negocio es franquiciable y construimos el modelo completo: números del franquiciado, manuales de operación, contrato y plan de expansión.',
        importancia:
          'Una franquicia mal diseñada quema la marca y a los socios. Bien hecha, es la forma más rápida de crecer sin poner todo el capital.',
        precio: '$490.000',
        accion: 'Pagar y agendar',
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
// testimonio.youtube es el código del video de YouTube; testimonio.video, un archivo propio.
// Cuando tengas el informe, completa informe.href.
// Frase de cierre que comparten vendedor y comprador de derechos de llave.
const FRASE_LLAVE = 'Lo más inteligente antes de invertir es asesorarse para invertir con inteligencia. Que no te gane la ansiedad: detente un minuto, déjate asesorar y te darás cuenta de que es la mejor inversión que harás.';

export const fichas = {
  'valorizacion-pyme': { href: '/valoriza', directo: true },
  // Derechos de llave: el visitante elige su perfil. Sin precios por ahora: solo contacto.
  'derecho-de-llave': {
    pregunta: '¿Vas a vender o a comprar?',
    perfiles: [
      {
        id: 'vendedor',
        boton: 'Soy vendedor',
        titulo: 'Vende tu negocio, no solo tu local',
        intro:
          'Esto no es corretaje de propiedades: es una asesoría comercial para vender tu negocio. Quien compra no se lleva un local, sino un negocio en marcha, con flujos proyectados y un plan para que le vaya bien.',
        rotulo: 'Qué incluye',
        puntos: [
          'Análisis completo del estado actual del negocio',
          'Diagnóstico actualizado de la operación y sus números',
          'Valorización del negocio, con un precio que puedas defender',
          'Estrategia de venta para encontrar al comprador ideal',
          'Flujos proyectados que muestran lo que el negocio puede generar',
          'Estrategia de lanzamiento y modelo de gestión para que al nuevo dueño le vaya bien',
        ],
        interes: 'llave-vendedor',
      },
      {
        id: 'comprador',
        boton: 'Soy comprador',
        titulo: 'Compra una oportunidad de crecimiento',
        intro:
          'Invierte en un negocio rentable y con proyección, donde lo que realmente compras es una oportunidad de crecimiento. Paga el precio justo y comienza a emprender como lo hacen los que saben.',
        rotulo: 'Cómo te ayudamos',
        puntos: [
          'Analizamos el derecho de llave que estás a punto de comprar: sus números reales, el precio justo y los riesgos',
          'O buscamos el negocio que mejor se ajuste a lo que buscas y necesitas',
        ],
        interes: 'llave-comprador',
      },
    ],
    frase: FRASE_LLAVE,
    accion: 'Contáctanos',
  },
  // Franquicias: un solo botón que despliega la asesoría 360°, con precio y pago.
  franquicias: {
    perfiles: [
      {
        id: 'franquicias-360',
        boton: 'Asesoramiento integral Franquicias 360°',
        titulo: 'Compra una franquicia con los ojos abiertos',
        intro:
          'Comprar una franquicia es comprar una promesa: ventas, márgenes y el apoyo de la marca. Mi trabajo es comprobar si esa promesa se cumple en la realidad. Lo hago con la experiencia de haber creado marcas franquiciadoras, de haber vendido franquicias y de haber escrito el libro Franquicia Justa.',
        rotulo: 'Qué hacemos',
        puntos: [
          'Te ayudo a elegir la franquicia que mejor se ajusta a tu capital, tu perfil y tus objetivos',
          'Auditamos por completo la oportunidad de negocio: números, contrato y modelo de la marca',
          'Comprobamos con franquiciados reales si la promesa de venta se cumple',
        ],
        etapas: [
          {
            paso: 'Reunión 1',
            detalle: 'Online o presencial',
            titulo: 'La oferta de franquicia',
            texto: 'Revisamos juntos la oferta y estudiamos a fondo la promesa de la marca: inversión, ventas esperadas, márgenes, costos y obligaciones.',
          },
          {
            paso: 'Semana de análisis',
            detalle: '1 semana',
            titulo: 'La marca en terreno',
            puntos: ['Análisis de mercado', 'Entrevistas a franquiciados reales', 'Informe de conclusiones y análisis de la marca'],
          },
          {
            paso: 'Reunión 2',
            detalle: 'Online o presencial',
            titulo: 'Informe y veredicto',
            texto: 'Te presento el informe de análisis de la marca: la veracidad de su promesa, sus alcances y las oportunidades reales de inversión.',
          },
        ],
        frase:
          'Ahorrarte la asesoría puede salir carísimo. Más vale invertir en la mirada de un experto que arriesgar todo tu capital en una marca que nunca fue rentable y cuya promesa resultó ser casi un engaño.',
        precio: '$490.000',
        precioDetalle: 'Incluye 2 reuniones, la semana de análisis y el informe final',
        pago: true,
        interes: 'franquicias',
      },
    ],
    accion: 'Contáctanos',
  },
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
    testimonio: { rotulo: 'Video testimonial', youtube: '-eZIogL3XjM' },
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
    titulo: 'Construir, caer y volver a construir',
    detalle:
      'Cómo construí una cadena de 14 locales, la perdí en la pandemia y volví a empezar. Lo que cada dueño debería revisar antes de abrir su próximo local. Para empresas, gremios y universidades.',
  },
  {
    titulo: 'Franquicia Justa',
    detalle:
      'Cómo crear, elegir y hacer crecer franquicias donde ganan las dos partes. El modelo del royalty que solo se cobra si el franquiciado gana. Para franquiciadores, inversionistas y emprendedores.',
  },
  {
    titulo: 'Primero el modelo, después el valor',
    detalle:
      'Rentabilidad por local, EBITDA y las decisiones que llevaron a una cafetería en quiebra a vender diez veces más. Para dueños de pymes y equipos de gestión.',
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
  { value: 'derecho-de-llave', label: 'Derechos de llave' },
  { value: 'llave-vendedor', label: 'Derechos de llave: quiero vender' },
  { value: 'llave-comprador', label: 'Derechos de llave: quiero comprar' },
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

// Kit de prensa (/prensa). Las bios van en tercera persona para que los medios las copien tal cual.
export const prensa = {
  nombre: 'Nico Pacheco',
  nombreLegal: 'Maximiliano Pacheco Ortiz',
  ciudad: 'Puerto Montt y Puerto Varas, Chile',
  bioCorta:
    'Nico Pacheco es empresario, director de empresas y autor de Franquicia Justa. Cofundó Mammaterra, cadena pionera de comida rápida saludable que llegó a 14 locales en Chile, y hoy dirige Kingdom Coffee. Asesora a dueños de pymes que quieren crecer sin poner en riesgo lo construido.',
  bioLarga: [
    'Nico Pacheco (Maximiliano Pacheco Ortiz) creció en Arauco y se pagó la universidad manejando un taxi de noche durante cuatro años. Se tituló de ingeniero acuícola en 2010 y antes de los 30 fundó y vendió negocios de transporte y turismo en el sur de Chile.',
    'En 2017 cofundó Mammaterra, cadena pionera de comida rápida saludable, que creció hasta 14 locales y dos plantas de producción con un modelo propio: la franquicia justa, donde el royalty se cobra solo si el franquiciado tiene utilidad. La pandemia obligó a cerrar la cadena después de casi dos años sosteniendo a su equipo y a sus franquiciados.',
    'De esa experiencia nació su método de crecimiento con disciplina financiera. Con él transformó una cafetería en quiebra en Kingdom Coffee, que hoy vende diez veces más que en 2024, y asesora a pymes y cadenas que quieren crecer, franquiciar o vender. En diciembre de 2026 lanza su libro Franquicia Justa.',
    'Es director ejecutivo de Plan Innova Puerto Montt y columnista de emprendimiento e innovación en El Llanquihue. Tiene un MBA de la Universidad Europea de Madrid y un Mágister en Dirección Comercial, Marketing e Innovación de la Universidad Andrés Bello.',
  ],
  temasEntrevista: [
    'Por qué fracasan las franquicias y cómo evaluar una antes de firmar',
    'Rentabilidad por local: el error de crecer sin mirar los números',
    'Perder una empresa y volver a empezar',
    'Emprender y crecer desde regiones',
    'Gastronomía: food cost, márgenes y el negocio detrás del plato',
  ],
  fotos: [
    { archivo: '/fotos/retrato-perfil.jpg', titulo: 'Retrato horizontal' },
    { archivo: '/fotos/speaker-azul-brazos.jpg', titulo: 'Retrato vertical' },
    { archivo: '/fotos/hero-escritorio.jpg', titulo: 'En su escritorio' },
    { archivo: '/fotos/conferencia-en-vivo.jpg', titulo: 'En conferencia' },
    { archivo: '/fotos/recortes/nico-brazos-cruzados.png', titulo: 'Recorte sin fondo (PNG)' },
    { archivo: '/fotos/libro/franquicia-justa-portada.jpg', titulo: 'Portada del libro' },
  ],
  libro: {
    titulo: 'Franquicia Justa',
    subtitulo: 'Reemplazando la subordinación por la colaboración',
    detalle: 'Los 7 pilares para crear, elegir y hacer crecer franquicias donde todos ganan.',
    datos: ['Prólogo de Gerardo Wijnant S.M.', '15 × 24 cm', 'ISBN 978-956-03-1419-2', 'Impreso y digital (Kindle, Apple Books y PDF)'],
    lanzamiento: 'Lanzamiento: sábado 12 de diciembre de 2026, 10:30, en Kingdom Coffee.',
  },
  // Agrega aquí cada nota: { medio, titulo, fecha, url }. Las que tengan url se muestran como enlace.
  apariciones: [
    {
      medio: 'Revista PM',
      titulo: 'Mammaterra: una propuesta gastronómica saludable, vegana y deliciosa',
      fecha: 'Feb 2021',
      url: 'https://www.revistapm.cl/reportajes/mammaterra/',
    },
    {
      medio: 'Diario Financiero',
      titulo: 'La fórmula "justa" de Mammaterra para crecer en pandemia',
      fecha: '2021',
      url: 'https://www.df.cl/empresas/consumo/la-formula-justa-de-mammaterra-para-crecer-en-pandemia-un-2021-con',
    },
    {
      medio: 'Diario Financiero',
      titulo: 'Mammaterra: la cadena de restaurantes vegetariana que apostó por el delivery para no perder su stock',
      fecha: 'Mar 2020',
      url: 'https://www.df.cl/df-lab/innovacion-y-startups/mammaterra-la-cadena-de-restaurantes-vegetariana-que-aposto-por-el',
    },
    {
      medio: 'Diario Concepción',
      titulo: 'Abrió en Concepción Mammaterra, la cadena de comida rápida saludable',
      fecha: 'Ago 2018',
      url: 'https://www.diarioconcepcion.cl/economia-y-negocios/2018/08/18/abrio-en-concepcion-mamaterra-la-cadena-de-comida-rapida-saludable.html',
    },
    {
      medio: 'SoyChile',
      titulo: 'Emprendimiento puertomontino Mammaterra se expande y abre franquicias',
      fecha: 'Jun 2018',
      url: 'https://www.soychile.cl/Puerto-Montt/Economia-y-Negocios/2018/06/26/541571/Emprendimiento-puertomontino-Mammaterra-se-expande-y-abre-franquicias.aspx',
    },
    {
      medio: 'La Tercera, Finde',
      titulo: 'Mammaterra, la hamburguesería regalona de los veggie',
      fecha: '',
      url: 'https://www.latercera.com/finde/noticia/mammaterra-la-hamburgueseria-regalona-de-los-veggie/',
    },
  ],
};
