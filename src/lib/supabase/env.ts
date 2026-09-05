/**
 * Lee las variables públicas de Supabase y falla con un mensaje claro si faltan.
 * Ambas son `NEXT_PUBLIC_` (seguras en el browser): el aislamiento entre
 * usuarios lo hace Row Level Security, no el secreto de la clave.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copiá .env.example a .env.local y completá los valores.",
    );
  }

  return { url, anonKey };
}

/** Chequeo sin excepción: útil en el middleware para no romper toda la app si falta la config. */
export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
