import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";

import { getSupabaseEnv } from "./env";

/**
 * Cliente de Supabase para código que corre en el servidor (Server Components,
 * Route Handlers, Server Actions). Lee y refresca la sesión desde las cookies.
 *
 * El `setAll` puede fallar si se llama desde un Server Component (no puede
 * escribir cookies); en ese caso el middleware es el que refresca la sesión.
 */
export async function createClient() {
  // `cookies()` primero: marca la ruta como dinámica antes de que un posible
  // error de env corte el render (si no, Next intenta prerenderizar y falla el
  // build cuando todavía no hay .env.local).
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Llamado desde un Server Component: ignorable si el middleware
          // se encarga de refrescar la sesión.
        }
      },
    },
  });
}
