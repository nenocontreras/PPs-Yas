import type { Metadata } from "next";

import { AuthCard } from "@/components/ui/auth-card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { ActualizarForm } from "./actualizar-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

// Depende de la sesión (link del email): nunca cachear ni prerenderizar.
export const dynamic = "force-dynamic";

async function getSessionUser() {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export default async function ActualizarPasswordPage() {
  // El usuario llega acá logueado por el link del email (verifyOtp en
  // /auth/confirm). Si no hay sesión, el link no sirvió.
  const user = await getSessionUser();

  return (
    <AuthCard
      title="Elegí una contraseña nueva"
      subtitle={
        user
          ? "Vas a poder ingresar con esta contraseña de ahora en más"
          : undefined
      }
      error={
        user
          ? undefined
          : "El link de recuperación venció o ya se usó. Pedí uno nuevo desde “¿La olvidaste?”."
      }
    >
      {user ? <ActualizarForm /> : null}
    </AuthCard>
  );
}
