import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function safeNext(raw: string | null): string {
  const next = raw ?? "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/**
 * Aterrizaje de los links que Supabase manda por email (confirmación de cuenta
 * y recuperación de contraseña). Soporta los dos formatos:
 *  - `?code=...`        → flujo PKCE (default de @supabase/ssr)
 *  - `?token_hash&type` → si se personaliza el template de email con {{ .TokenHash }}
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(`${origin}/login`);
  }
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=enlace_invalido`);
}
