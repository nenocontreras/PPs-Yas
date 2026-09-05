import type { Metadata } from "next";

import { listJornadas } from "@/lib/bitacora";
import { requireUser } from "@/lib/supabase/require-user";

import { BitacoraView } from "./bitacora-view";

export const metadata: Metadata = { title: "Bitácora" };

export default async function BitacoraPage() {
  const { supabase, user } = await requireUser();
  const jornadas = await listJornadas(supabase, user.id);
  return <BitacoraView jornadas={jornadas} />;
}
