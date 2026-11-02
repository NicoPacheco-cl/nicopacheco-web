import { redirect } from 'next/navigation';

// Ruta antigua de la compra del libro: redirige a la página general de gracias.
export default async function GraciasLibro({ searchParams }) {
  const p = await searchParams;
  redirect(`/gracias?${new URLSearchParams(p).toString()}`);
}
