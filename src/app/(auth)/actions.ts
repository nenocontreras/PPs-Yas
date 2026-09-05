"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getSiteURL } from "@/lib/site-url";
import { validateEmail, validatePassword } from "@/lib/validation";

export type AuthState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
  values?: { email?: string };
};

/** Evita open-redirects: solo rutas internas. */
function safeNext(raw: FormDataEntryValue | null): string {
  const next = String(raw ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = validateEmail(formData.get("email"));
  const password = validatePassword(formData.get("password"), { min: 1 });
  if (email.error || password.error) {
    return {
      fieldErrors: { email: email.error, password: password.error },
      values: { email: email.value },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  if (error) {
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Confirmá tu email antes de ingresar. Revisá tu casilla."
          : "El email o la contraseña son incorrectos.",
      values: { email: email.value },
    };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = validateEmail(formData.get("email"));
  const password = validatePassword(formData.get("password"));
  if (email.error || password.error) {
    return {
      fieldErrors: { email: email.error, password: password.error },
      values: { email: email.value },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: { emailRedirectTo: `${getSiteURL()}/auth/confirm` },
  });

  if (error) {
    return {
      error:
        error.code === "user_already_exists" ||
        error.code === "email_exists"
          ? "Ya existe una cuenta con ese email."
          : "No se pudo crear la cuenta. Intentá de nuevo en un momento.",
      values: { email: email.value },
    };
  }

  // Con confirmación de email activada, `session` viene null y hay que verificar.
  if (data.session) redirect("/");
  redirect(`/verifica-tu-email?email=${encodeURIComponent(email.value)}`);
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = validateEmail(formData.get("email"));
  if (email.error) {
    return { fieldErrors: { email: email.error }, values: { email: email.value } };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${getSiteURL()}/auth/confirm?next=/actualizar-password`,
  });

  // Respuesta uniforme: no revelamos si el email existe o no.
  redirect(
    `/verifica-tu-email?email=${encodeURIComponent(email.value)}&modo=recuperacion`,
  );
}

export async function resendConfirmation(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = validateEmail(formData.get("email"));
  if (email.error) return { error: "No se pudo reenviar. Volvé a registrarte." };

  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email: email.value,
    options: { emailRedirectTo: `${getSiteURL()}/auth/confirm` },
  });
  // Sin distinción de resultado (no revelamos si el email existe / ya está confirmado).
  return { values: { email: email.value } };
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = validatePassword(formData.get("password"));
  const confirm = String(formData.get("confirm") ?? "");
  if (password.error) return { fieldErrors: { password: password.error } };
  if (password.value !== confirm) {
    return { fieldErrors: { password: "Las contraseñas no coinciden." } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error:
        "El link de recuperación venció o ya se usó. Pedí uno nuevo desde “¿La olvidaste?”.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: password.value });
  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "La contraseña nueva no puede ser igual a la anterior."
          : "No se pudo actualizar la contraseña. Intentá de nuevo.",
    };
  }

  redirect("/?password=actualizada");
}
