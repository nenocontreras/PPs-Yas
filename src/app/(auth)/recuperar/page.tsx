import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/ui/auth-card";

import { RecuperarForm } from "./recuperar-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <AuthCard
      title="Recuperá tu contraseña"
      subtitle="Te enviamos un link para restablecerla"
      footer={
        <>
          Volver a{" "}
          <Link href="/login" className="font-medium text-ink hover:underline">
            ingresar
          </Link>
        </>
      }
    >
      <RecuperarForm />
    </AuthCard>
  );
}
