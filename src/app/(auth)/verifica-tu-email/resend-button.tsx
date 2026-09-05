"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { resendConfirmation, type AuthState } from "../actions";

const EMPTY: AuthState = {};

export function ResendButton({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(resendConfirmation, EMPTY);
  const sent = Boolean(state.values?.email);

  return (
    <form action={formAction}>
      <input type="hidden" name="email" value={email} />
      <Button
        type="submit"
        variant="secondary"
        block
        loading={pending}
        disabled={sent}
      >
        {sent ? "Email reenviado" : "Reenviar email"}
      </Button>
    </form>
  );
}
