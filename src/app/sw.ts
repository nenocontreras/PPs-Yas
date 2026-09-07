import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
} from "serwist";

// El manifest de precache lo inyecta @serwist/next en build.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: [
    ...(self.__SW_MANIFEST ?? []),
    // El HTML prerenderizado de App Router NO entra en __SW_MANIFEST (solo
    // assets de webpack y public/). Sin esta línea el fallback offline de
    // navegación de más abajo nunca resuelve. Subí el `revision` si cambia
    // el contenido de src/app/~offline/page.tsx.
    { url: "/~offline", revision: "offline-v1" },
  ],
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    // --- Navegaciones: el SW NO se mete ------------------------------------
    {
      // Las páginas del dashboard son SSR con auth y algunas llevan headers
      // COEP `credentialless` (/entrevistas, /busqueda). Que el SW las intente
      // cachear rompía la navegación con `no-response`. Van siempre a la red;
      // el fallback offline de abajo cubre el caso sin conexión.
      matcher: ({ request, url }) =>
        request.mode === "navigate" && url.origin === self.location.origin,
      handler: new NetworkOnly(),
    },
    // --- Supabase: datos privados, NUNCA cache-first ----------------------
    {
      // Sesión / tokens y CONTENIDO DE ARCHIVOS (Storage / Evidencia): siempre a
      // la red. Dejar documentos o fotos de la empresa en el CacheStorage del
      // dispositivo contradice "datos privados".
      matcher: ({ url }) =>
        url.hostname.endsWith(".supabase.co") &&
        (url.pathname.startsWith("/auth/v1/") ||
          url.pathname.startsWith("/storage/v1/")),
      handler: new NetworkOnly(),
    },
    {
      // Sólo REST (metadatos ya anonimizados): network-first, TTL corto.
      matcher: ({ url }) =>
        url.hostname.endsWith(".supabase.co") &&
        url.pathname.startsWith("/rest/v1/"),
      method: "GET",
      handler: new NetworkFirst({
        cacheName: "supabase",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 30 }),
        ],
      }),
    },
    // --- Runtime WASM de ONNX (propio origen, /ort/) ---------------------
    {
      matcher: ({ url }) =>
        url.origin === self.location.origin && url.pathname.startsWith("/ort/"),
      handler: new CacheFirst({
        cacheName: "ort-runtime",
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 90 }),
        ],
      }),
    },
    // --- Modelo Whisper / gte-small desde el CDN de Hugging Face ----------
    {
      // Los shards del modelo (~75 MB). CacheFirst para no re-descargarlos.
      // No hay datos del usuario: es cliente ↔ CDN de modelos.
      matcher: ({ url }) =>
        url.hostname === "huggingface.co" ||
        url.hostname.endsWith(".huggingface.co") ||
        url.hostname.endsWith(".hf.co"),
      handler: new CacheFirst({
        cacheName: "ml-models",
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 90,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    // --- Resto (estáticos, fuentes, imágenes) ----------------------------
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
