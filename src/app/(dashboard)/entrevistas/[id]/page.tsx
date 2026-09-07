import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEntrevista } from "@/lib/entrevistas";
import { hasSummaryProvider } from "@/lib/resumen";
import { requireUser } from "@/lib/supabase/require-user";

import { EntrevistaDetail } from "./entrevista-detail";

export const metadata: Metadata = { title: "Entrevista" };

export default async function EntrevistaPage({
  params,
}: PageProps<"/entrevistas/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const entrevista = await getEntrevista(supabase, user.id, id);
  if (!entrevista) notFound();

  return (
    <EntrevistaDetail
      entrevista={entrevista}
      resumenHabilitado={hasSummaryProvider()}
    />
  );
}
