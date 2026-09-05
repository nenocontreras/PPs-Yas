import { DashboardNav } from "@/components/dashboard-nav";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  if (!hasSupabaseEnv()) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-sm leading-relaxed">
        <h1 className="text-lg font-semibold">Falta configurar Supabase</h1>
        <p className="mt-2 text-muted">
          Copiá <code>.env.example</code> a <code>.env.local</code> y completá{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Ver el README.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex min-h-full max-w-6xl">
      <DashboardNav userEmail={user?.email ?? undefined} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:pt-8 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
