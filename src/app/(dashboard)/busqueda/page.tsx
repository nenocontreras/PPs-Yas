import type { Metadata } from "next";

import { requireUser } from "@/lib/supabase/require-user";

import { contarIndice } from "./actions";
import { BusquedaView } from "./busqueda-view";

export const metadata: Metadata = { title: "Búsqueda" };

export default async function BusquedaPage() {
  await requireUser();
  const indexados = await contarIndice();
  return <BusquedaView indexados={indexados} />;
}
