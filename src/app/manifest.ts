import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cuentas del hogar",
    short_name: "Cuentas",
    description:
      "Ingresos, gastos, diezmo, deudas y trazabilidad para tu hogar en pareja.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f3ece4",
    theme_color: "#c45c4a",
    lang: "es-CL",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
