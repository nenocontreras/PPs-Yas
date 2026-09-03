import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata: Metadata = { title: "Tareas" };

export default function TareasPage() {
  return <ModulePlaceholder href="/tareas" />;
}
