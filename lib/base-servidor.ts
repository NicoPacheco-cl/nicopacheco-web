import "server-only";
import { createClient } from "@supabase/supabase-js";

// Conexión a Supabase desde el servidor, con la clave secreta. Las tablas de la valorización no se leen desde el navegador.
export function cliente() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Bucket privado con los documentos de las valorizaciones.
export const BUCKET = "valorizaciones";
