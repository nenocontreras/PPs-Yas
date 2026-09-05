"use client";

import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "./button";

/**
 * Botón de submit para formularios con Server Actions: entra en `loading`
 * automáticamente mientras la acción está pendiente.
 */
export function SubmitButton({ children, ...props }: Omit<ButtonProps, "loading" | "type">) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...props}>
      {children}
    </Button>
  );
}
