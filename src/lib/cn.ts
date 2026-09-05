type ClassValue = string | number | bigint | false | null | undefined;

/** Une clases condicionalmente. Sin merge de Tailwind: no repitas utilidades en conflicto. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
