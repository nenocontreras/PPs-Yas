import type { Metadata } from "next";

import { listEventos } from "@/lib/calendario";
import { requireUser } from "@/lib/supabase/require-user";

import { CalendarioView } from "./calendario-view";

export const metadata: Metadata = { title: "Calendario" };

export default async function CalendarioPage() {
  const { supabase, user } = await requireUser();
  const eventos = await listEventos(supabase, user.id);
  return <CalendarioView eventos={eventos} />;
}
