"use client";

import Link from "next/link";
import { useActionState } from "react";

import { LockIcon, MailIcon } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

import { login, type AuthState } from "../actions";

const EMPTY: AuthState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(login, EMPTY);

  return (
    <>
      {state.error && (
        <Alert tone="danger" className="mb-4">
          {state.error}
        </Alert>
      )}
      <form action={formAction} noValidate className="flex flex-col gap-3.5">
        {next && <input type="hidden" name="next" value={next} />}
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
          autoComplete="current-password"
          required
          icon={<LockIcon />}
          error={state.fieldErrors?.password}
          labelRight={
            <Link
              href="/recuperar"
              className="text-xs text-muted hover:text-ink hover:underline"
            >
              ¿La olvidaste?
            </Link>
          }
        />
        <SubmitButton size="lg" block className="mt-1">
          Ingresar
        </SubmitButton>
      </form>
    </>
  );
}
