import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 regenera AGENTS.md / CLAUDE.md en cada `next dev`. El contexto del
  // proyecto ya vive en el CLAUDE.md del repo y en .claude/ — no queremos ese
  // archivo autogenerado ensuciando el árbol.
  agentRules: false,

  async headers() {
    // Aislamiento cross-origin SOLO en las rutas que corren modelos en el
    // navegador (Whisper en /entrevistas, embeddings en /busqueda): habilita los
    // threads WASM. `credentialless` no exige CORP en las respuestas del CDN de
    // modelos. Se limita a estas rutas para no romper las URLs firmadas de
    // Evidencia ni el resto de la app.
    const coi = [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
    ];
    return [
      { source: "/entrevistas/:path*", headers: coi },
      { source: "/busqueda/:path*", headers: coi },
    ];
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Los .wasm de onnxruntime (~25 MB c/u en public/ort/) no van al precache del
  // app shell; se cachean en runtime (regla "ort-runtime" en sw.ts) al abrir la
  // transcripción. El glue .mjs sí se precachea (es chico).
  exclude: [/\.wasm$/],
  // En desarrollo el SW molesta más de lo que ayuda (cachea builds viejos).
  disable: process.env.NODE_ENV === "development",
  // reloadOnOnline se deja en false (default): recargar en cada reconexión
  // haría perder trabajo en móvil con señal inestable (formularios a medio
  // llenar, transcripción Whisper en curso).
});

export default withSerwist(nextConfig);
