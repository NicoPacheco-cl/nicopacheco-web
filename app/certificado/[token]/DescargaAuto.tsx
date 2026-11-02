"use client";

import { useEffect } from "react";

// Recién pagado, el certificado se descarga solo. Si el navegador lo bloquea, sigue el botón de la página.
export function DescargaAuto({ url }: { url: string }) {
  useEffect(() => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.click();
    window.history.replaceState(null, "", window.location.pathname);
  }, [url]);
  return null;
}
