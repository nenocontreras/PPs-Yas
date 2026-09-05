import type { Metadata } from "next";
import Link from "next/link";

import { MailIcon } from "@/components/icons";

import { ResendButton } from "./resend-button";

export const metadata: Metadata = { title: "Revisá tu email" };

export default async function VerificaTuEmailPage({
  searchParams,
}: PageProps<"/verifica-tu-email">) {
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";
  const esRecuperacion = sp.modo === "recuperacion";

  return (
    <div className="w-full max-w-[400px]">
      <div className="rounded-[0.875rem] border border-line bg-surface p-8 text-center shadow-[0_4px_16px_-6px_rgb(15_23_42/0.12)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-slate-700 dark:text-slate-200">
          <MailIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-lg font-semibold">Revisá tu email</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          {esRecuperacion ? (
            <>
              Si <b className="text-ink">{email || "tu email"}</b> tiene una
              cuenta, te mandamos un link para elegir una contraseña nueva.
            </>
          ) : (
            <>
              Te enviamos un link a{" "}
              <b className="text-ink">{email || "tu email"}</b> para confirmar tu
              cuenta. Si no lo ves, revisá spam.
            </>
          )}
        </p>

        {!esRecuperacion && email && (
          <div className="mt-6">
            <ResendButton email={email} />
          </div>
        )}

        <p className="mt-5 text-[13px] text-muted">
          Volver a{" "}
          <Link href="/login" className="font-medium text-ink hover:underline">
            ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}
