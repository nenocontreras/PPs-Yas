import Link from "next/link";

import { MODULES } from "@/lib/modules";

export default function InicioPage() {
  const modules = MODULES.filter((m) => m.href !== "/");

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Gestión de PPS
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Esqueleto de la app. Todavía sin funcionalidad: los módulos se
          construyen por fases (ver <code>CLAUDE.md</code>). Ya es instalable
          como PWA desde el celular.
        </p>
      </header>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium">Próximo paso</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Fase 2: autenticación con Supabase Auth. Este panel se reemplaza por
          el de progreso en la Fase 5.
        </p>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Módulos
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <li key={m.href}>
              <Link
                href={m.href}
                className="flex h-full min-h-16 items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
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
