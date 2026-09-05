import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv, hasSupabaseEnv } from "./env";

/** Rutas accesibles sin sesión. */
const AUTH_PATHS = [
  "/login",
  "/registro",
  "/recuperar",
  "/actualizar-password",
  "/verifica-tu-email",
];

function matchesAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refresca la sesión de Supabase en cada request y aplica las reglas de acceso:
 * - sin sesión + ruta protegida → /login?next=...
 * - con sesión + ruta de auth → / (salvo /actualizar-password, parte del flujo
 *   de recuperación donde el usuario ya está logueado por el link del email).
 */
export async function updateSession(request: NextRequest) {
  // Sin config de Supabase dejamos pasar todo: la app arranca y cada llamada
  // muestra el error de "falta .env.local" en su contexto.
  if (!hasSupabaseEnv()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPath = matchesAuthPath(pathname);

  if (!user && !isAuthPath) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.search = "";
    if (pathname !== "/") redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && isAuthPath && pathname !== "/actualizar-password") {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}
