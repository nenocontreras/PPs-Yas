import type { Metadata } from "next";

import { listEntrevistas } from "@/lib/entrevistas";
import { requireUser } from "@/lib/supabase/require-user";

import { EntrevistasView } from "./entrevistas-view";

export const metadata: Metadata = { title: "Entrevistas" };

export default async function EntrevistasPage() {
  const { supabase, user } = await requireUser();
  const entrevistas = await listEntrevistas(supabase, user.id);
  return <EntrevistasView entrevistas={entrevistas} />;
}
