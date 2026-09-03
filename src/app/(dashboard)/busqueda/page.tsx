import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata: Metadata = { title: "Búsqueda" };

export default function BusquedaPage() {
  return <ModulePlaceholder href="/busqueda" />;
}
