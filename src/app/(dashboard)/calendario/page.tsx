import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata: Metadata = { title: "Calendario" };

export default function CalendarioPage() {
  return <ModulePlaceholder href="/calendario" />;
}
