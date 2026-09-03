import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./env";

/**
 * Cliente de Supabase para componentes que corren en el navegador
 * (`"use client"`). Usa la `anon key` + la sesión del usuario en cookies.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
