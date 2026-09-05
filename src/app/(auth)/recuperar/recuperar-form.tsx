"use client";

import { useActionState } from "react";

import { MailIcon } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

import { requestPasswordReset, type AuthState } from "../actions";

const EMPTY: AuthState = {};

export function RecuperarForm() {
  const [state, formAction] = useActionState(requestPasswordReset, EMPTY);

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
        <SubmitButton size="lg" block className="mt-1">
          Enviar link
        </SubmitButton>
      </form>
    </>
  );
}
