"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Recarga los datos de la página cada pocos segundos mientras la IA lee los documentos.
export function Refrescar({ segundos }: { segundos: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), segundos * 1000);
    return () => clearInterval(id);
  }, [router, segundos]);
  return null;
}
