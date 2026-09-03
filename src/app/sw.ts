import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist";

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
      // Sesión / tokens: siempre a la red, jamás al cache.
      matcher: ({ url }) =>
        url.hostname.endsWith(".supabase.co") &&
        url.pathname.startsWith("/auth/v1/"),
      handler: new NetworkOnly(),
    },
    {
      // REST y Storage: network-first con TTL corto para que "offline" no
      // sirva datos viejos de otra sesión indefinidamente. Al hacer signOut
      // (Fase 2) conviene limpiar el cache "supabase".
      matcher: ({ url }) => url.hostname.endsWith(".supabase.co"),
      method: "GET",
      handler: new NetworkFirst({
        cacheName: "supabase",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 30 }),
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

// TODO (Fase 6 — módulo de entrevistas):
//  - El modelo Whisper (cientos de MB en shards) necesita su propia regla de
//    runtime caching: CacheFirst + RangeRequestsPlugin + ExpirationPlugin
//    generoso + cacheName propio, ANTES de ...defaultCache (el catch-all
//    cross-origin de defaultCache es 32 entradas / 1 h, inservible para esto).
//  - Si se usan threads WASM hará falta COOP/COEP. COEP `require-corp` global
//    rompe los fetch cross-origin del SW (Supabase, CDN del modelo) salvo CORP;
//    usar `credentialless`, limitar los headers a la ruta /entrevistas, o
//    self-hostear el modelo bajo /public. transformers.js puede correr
//    single-thread sin aislamiento como fallback.
