import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/anton/400.css';
import '@fontsource-variable/bricolage-grotesque/wght.css';
import '@fontsource-variable/public-sans/wght.css';
import '@fontsource-variable/public-sans/wght-italic.css';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://nicopacheco.cl'),
  title: 'Nico Pacheco · Mentor de pymes, director de empresas y conferencista',
  description:
    'Ayudo a dueños de pymes a ganar más, valorizar su negocio y venderlo o franquiciarlo. Mentoring, Diagnóstico Pyme, valorización de empresas, franquicias y conferencias.',
  openGraph: {
    title: 'Nico Pacheco',
    description:
      'Mentor de pymes, director de empresas y conferencista. Gastronomía, finanzas, compraventa de negocios y franquicias.',
    images: ['/fotos/hero-escritorio.jpg'],
    locale: 'es_CL',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#0D0D0D',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  );
}
