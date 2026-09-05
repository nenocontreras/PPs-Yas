import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/ui/auth-card";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

const URL_ERRORS: Record<string, string> = {
  enlace_invalido:
    "El enlace del email venció o ya se usó. Pedí uno nuevo e intentá otra vez.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const urlError =
    typeof sp.error === "string" ? URL_ERRORS[sp.error] : undefined;

  return (
    <AuthCard
      title="Ingresá a tu cuenta"
      subtitle="Gestión de Prácticas Profesionales Supervisadas"
      error={urlError}
      footer={
        <>
          ¿No tenés cuenta?{" "}
          <Link
            href="/registro"
            className="font-medium text-ink hover:underline"
          >
            Crear una
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthCard>
  );
}
