import { redirect } from "next/navigation";

import { createClient } from "./server";

/** Cliente + usuario autenticado. Redirige a /login si no hay sesión. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
