/** Validaciones mínimas de los formularios de auth (sin dependencias). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN = 8;

export function validateEmail(value: FormDataEntryValue | null): {
  value: string;
  error?: string;
} {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email) return { value: email, error: "Ingresá tu email." };
  if (!EMAIL_RE.test(email)) return { value: email, error: "Ingresá un email válido." };
  return { value: email };
}

export function validatePassword(
  value: FormDataEntryValue | null,
  { min = PASSWORD_MIN }: { min?: number } = {},
): { value: string; error?: string } {
  const password = String(value ?? "");
  if (!password) return { value: password, error: "Ingresá una contraseña." };
  if (password.length < min)
    return { value: password, error: `Mínimo ${min} caracteres.` };
  return { value: password };
}
