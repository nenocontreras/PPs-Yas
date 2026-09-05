/** Estado compartido de los formularios con Server Actions + useActionState. */
export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export const OK: FormState = { ok: true };

export function fieldError(
  fieldErrors: Record<string, string>,
): FormState | null {
  return Object.keys(fieldErrors).length ? { fieldErrors } : null;
}

export function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export function optionalStr(value: FormDataEntryValue | null): string | null {
  const s = str(value);
  return s.length ? s : null;
}
