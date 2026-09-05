import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

import { getSupabaseEnv } from "./env";

/**
 * Cliente de Supabase para componentes que corren en el navegador
 * (`"use client"`). Usa la `anon key` + la sesión del usuario en cookies.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
