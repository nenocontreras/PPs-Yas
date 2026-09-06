import { getPanelData } from "@/lib/panel";
import { requireUser } from "@/lib/supabase/require-user";

import { PanelProgreso } from "./panel-progreso";

export default async function InicioPage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();
  const data = await getPanelData(supabase, user.id);

  return (
    <PanelProgreso
      nombre={user.email?.split("@")[0]}
      data={data}
      passwordUpdated={sp.password === "actualizada"}
    />
  );
}
