import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";
import { MODULES } from "@/lib/modules";

export default async function InicioPage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const passwordUpdated = sp.password === "actualizada";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const nombre = user?.email?.split("@")[0];

  const modules = MODULES.filter((m) => m.href !== "/");

  return (
    <div className="mx-auto max-w-3xl">
      {passwordUpdated && (
        <Alert tone="success" className="mb-4">
          Tu contraseña se actualizó.
        </Alert>
      )}

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {nombre ? `Hola, ${nombre}` : "Gestión de PPS"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Esqueleto navegable con autenticación. Los módulos se construyen por
          fases (ver <code>CLAUDE.md</code>). Este panel se reemplaza por el de
          progreso en la Fase 5.
        </p>
      </header>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <p className="text-sm font-medium">Próximo paso</p>
        <p className="mt-1 text-sm text-muted">
          Fase 5: panel de progreso. Bitácora, Tareas, Calendario y Evidencia ya
          funcionan.
        </p>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">
        Módulos
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <li key={m.href}>
              <Link
                href={m.href}
                className="flex h-full min-h-16 items-start gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-slate-700 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted">
                    {m.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
