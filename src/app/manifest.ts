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
    // TODO Fase 8: agregar `screenshots` (1-2 capturas reales, 390x844 narrow)
    // para el diálogo de instalación enriquecido de Chrome Android.
    icons: [
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
