"use client";

import { useActionState } from "react";

import { LockIcon } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

import { updatePassword, type AuthState } from "../actions";

const EMPTY: AuthState = {};

export function ActualizarForm() {
  const [state, formAction] = useActionState(updatePassword, EMPTY);

  return (
    <>
      {state.error && (
        <Alert tone="danger" className="mb-4">
          {state.error}
        </Alert>
      )}
      <form action={formAction} noValidate className="flex flex-col gap-3.5">
        <TextField
          label="Contraseña nueva"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          icon={<LockIcon />}
          hint="Mínimo 8 caracteres."
          error={state.fieldErrors?.password}
        />
        <TextField
          label="Repetir contraseña"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          icon={<LockIcon />}
        />
        <SubmitButton size="lg" block className="mt-1">
          Guardar contraseña
        </SubmitButton>
      </form>
    </>
  );
}
