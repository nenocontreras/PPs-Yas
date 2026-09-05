import type { Metadata } from "next";

import { listTareas } from "@/lib/tareas";
import { requireUser } from "@/lib/supabase/require-user";

import { TareasView } from "./tareas-view";

export const metadata: Metadata = { title: "Tareas" };

export default async function TareasPage() {
  const { supabase, user } = await requireUser();
  const tareas = await listTareas(supabase, user.id);
  return <TareasView tareas={tareas} />;
}
