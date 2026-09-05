/**
 * URL absoluta del sitio, para los links que Supabase manda por email
 * (confirmación de cuenta, recuperación de contraseña).
 *
 * Prioridad:
 *  1. NEXT_PUBLIC_SITE_URL — definila en producción (ej. https://pps.vercel.app)
 *  2. VERCEL_URL — la asigna Vercel en cada deploy (preview incluido)
 *  3. http://localhost:3000 — desarrollo
 */
export function getSiteURL(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    "http://localhost:3000";

  return raw.replace(/\/+$/, "");
}
