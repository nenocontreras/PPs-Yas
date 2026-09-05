"use client";

import { useActionState } from "react";

import { LockIcon, MailIcon } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

import { signup, type AuthState } from "../actions";

const EMPTY: AuthState = {};

export function RegistroForm() {
  const [state, formAction] = useActionState(signup, EMPTY);

  return (
    <>
      {state.error && (
        <Alert tone="danger" className="mb-4">
          {state.error}
        </Alert>
      )}
      <form action={formAction} noValidate className="flex flex-col gap-3.5">
        <TextField
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
          icon={<MailIcon />}
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email}
        />
        <TextField
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          icon={<LockIcon />}
          hint="Mínimo 8 caracteres."
          error={state.fieldErrors?.password}
        />
        <SubmitButton size="lg" block className="mt-1">
          Crear cuenta
        </SubmitButton>
      </form>
    </>
  );
}
