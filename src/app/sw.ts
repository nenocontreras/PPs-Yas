import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  RangeRequestsPlugin,
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
  // Sin clientsClaim: el SW nuevo toma control recién en la próxima
  // navegación. Evita ChunkLoadError en pestañas abiertas durante un deploy
  // (los chunks hasheados viejos ya no existen en el nuevo precache).
  navigationPreload: true,
  runtimeCaching: [
    // --- Supabase: datos privados, NUNCA cache-first --------------------------
    {
      // Sesión / tokens y CONTENIDO DE ARCHIVOS (Storage / Evidencia): siempre a
      // la red, jamás al cache. Dejar documentos o fotos de la empresa en el
      // CacheStorage del dispositivo contradice "datos privados" (el cache no se
      // limpia al expirar la sesión ni al cerrar la pestaña).
      matcher: ({ url }) =>
        url.hostname.endsWith(".supabase.co") &&
        (url.pathname.startsWith("/auth/v1/") ||
          url.pathname.startsWith("/storage/v1/")),
      handler: new NetworkOnly(),
    },
    {
      // Sólo REST (metadatos: jornadas, tareas, transcripciones ya anonimizadas):
      // network-first con TTL corto para que "offline" no sirva datos viejos de
      // otra sesión indefinidamente. Se limpia además en signOut (Fase 2).
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
    // --- Modelos ML (Whisper / gte-small) + runtime de ONNX -----------------
    {
      // Los shards del modelo (cientos de MB) vienen del CDN de Hugging Face y
      // el `ort-*.wasm` de jsDelivr. Sin regla propia caen en el catch-all de
      // defaultCache (32 entradas / 1 h): el modelo se re-descarga seguido y la
      // transcripción no anda offline. CacheFirst + expiración generosa.
      // No hay datos del usuario acá: es cliente ↔ CDN de modelos.
      matcher: ({ url }) =>
        url.hostname === "huggingface.co" ||
        url.hostname.endsWith(".huggingface.co") ||
        url.hostname.endsWith(".hf.co") ||
        (url.hostname === "cdn.jsdelivr.net" &&
          (url.pathname.includes("@huggingface/transformers") ||
            url.pathname.includes("onnxruntime-web"))),
      handler: new CacheFirst({
        cacheName: "ml-models",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new RangeRequestsPlugin(),
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 90,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    // --- Resto (estáticos, fuentes, etc.) ------------------------------------
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        // Página que se muestra al navegar sin conexión a algo no cacheado.
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
