/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // El botón antiguo llevaba al formulario de contacto: esos enlaces ahora abren el diagnóstico.
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'query', key: 'interes', value: 'diagnostico-gratis' }],
        destination: '/diagnostico',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
