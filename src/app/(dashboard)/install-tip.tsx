"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cuentas-hide-install-tip";

export function InstallTip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
      const ua = window.navigator.userAgent;
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      const nav = window.navigator as Navigator & { standalone?: boolean };
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        nav.standalone === true;
      if (isIOS && !standalone) setVisible(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="ui-card mb-4 border-primary/20 bg-primary/[0.07] p-4 text-sm text-foreground shadow-none ring-1 ring-primary/15">
      <p className="font-medium text-primary">Usar como app en el iPhone</p>
      <p className="mt-1.5 leading-relaxed text-muted-foreground">
        Tocá el botón <strong className="text-foreground">Compartir</strong> (cuadrado con flecha
        hacia arriba) y elegí{" "}
        <strong className="text-foreground">Añadir a inicio</strong>. Así se abre
        pantalla completa, como una app normal.
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* ignore */
          }
          setVisible(false);
        }}
        className="mt-3 text-xs font-semibold text-primary underline-offset-4 hover:underline"
      >
        Entendido, ocultar
      </button>
    </div>
  );
}
