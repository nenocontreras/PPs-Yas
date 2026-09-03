import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 regenera AGENTS.md / CLAUDE.md en cada `next dev`. El contexto del
  // proyecto ya vive en el CLAUDE.md del repo y en .claude/ — no queremos ese
  // archivo autogenerado ensuciando el árbol.
  agentRules: false,
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // En desarrollo el SW molesta más de lo que ayuda (cachea builds viejos).
  disable: process.env.NODE_ENV === "development",
  // reloadOnOnline se deja en false (default): recargar en cada reconexión
  // haría perder trabajo en móvil con señal inestable (formularios a medio
  // llenar, transcripción Whisper en curso).
});

export default withSerwist(nextConfig);
