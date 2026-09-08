import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Convención `proxy` de Next 16 (antes `middleware`). Refresca la sesión de
 * Supabase en cada request y aplica las reglas de acceso a `(dashboard)`.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas las rutas menos:
     * - _next/static, _next/image (assets del build)
     * - archivos de la PWA: favicon, manifest, service worker, íconos
     * - /ort/ (runtime WASM de ONNX; lo pide el worker de transcripción y NO
     *   debe pasar por el check de sesión — cada request dispararía un
     *   `supabase.auth.getUser()` y en móvil eso cuelga la carga del modelo)
     * - /~offline (fallback offline)
     * - /auth/ (route handlers de confirmación: manejan su propia sesión)
     * - archivos estáticos por extensión (incluidos .wasm y .mjs)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\\.js|icons/|ort/|~offline|auth/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml|woff2?|wasm|mjs)$).*)",
  ],
};
