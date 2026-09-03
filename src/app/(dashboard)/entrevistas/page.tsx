import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata: Metadata = { title: "Entrevistas" };

export default function EntrevistasPage() {
  return <ModulePlaceholder href="/entrevistas" />;
}
