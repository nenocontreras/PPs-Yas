import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // `id` fija la identidad de instalación en Chrome (independiente de start_url).
    id: "/",
    name: "Gestión de PPS",
    short_name: "PPS",
    description:
      "Bitácora, tareas, evidencia, calendario y entrevistas para tus " +
      "Prácticas Profesionales Supervisadas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    lang: "es-AR",
    dir: "ltr",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    categories: ["education", "productivity"],
    prefer_related_applications: false,
    shortcuts: [
      {
        name: "Registrar jornada",
        short_name: "Jornada",
        url: "/bitacora",
      },
      {
        name: "Nueva entrevista",
        short_name: "Entrevista",
        url: "/entrevistas",
      },
    ],
    // TODO Fase 8: agregar `screenshots` (1-2 capturas reales de la app,
    // 390x844 narrow + una wide) para el diálogo de instalación enriquecido
    // de Chrome Android. Requiere la app deployada para capturarlas.
    icons: [
      {
        // Favicon vectorial + fuente para navegadores que lo prefieren.
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
