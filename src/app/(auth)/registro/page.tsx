import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/ui/auth-card";

import { RegistroForm } from "./registro-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <AuthCard
      title="Creá tu cuenta"
      subtitle="Para estudiantes que están haciendo su PPS"
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-ink hover:underline">
            Ingresar
          </Link>
        </>
      }
      legal="Al crear la cuenta aceptás el uso responsable de datos de tu PPS."
    >
      <RegistroForm />
    </AuthCard>
  );
}
