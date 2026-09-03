import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata: Metadata = { title: "Evidencia" };

export default function EvidenciaPage() {
  return <ModulePlaceholder href="/evidencia" />;
}
