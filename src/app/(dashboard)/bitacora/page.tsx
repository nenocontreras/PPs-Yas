import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata: Metadata = { title: "Bitácora" };

export default function BitacoraPage() {
  return <ModulePlaceholder href="/bitacora" />;
}
