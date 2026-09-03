import { getModuleByHref } from "@/lib/modules";

/**
 * Placeholder para un módulo todavía no implementado. Muestra el nombre, la
 * descripción y en qué fase del plan (CLAUDE.md) se construye.
 */
export function ModulePlaceholder({ href }: { href: string }) {
  const mod = getModuleByHref(href);
  if (!mod) return null;
  const Icon = mod.icon;

  return (
    <section className="mx-auto max-w-xl">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
          <Icon className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">{mod.label}</h1>
      </header>

      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {mod.description}
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <p className="font-medium text-slate-700 dark:text-slate-200">
          Módulo en construcción
        </p>
        <p className="mt-1">
          Se implementa en la Fase {mod.phase} del plan de construcción. Por
          ahora esto es solo el esqueleto navegable.
        </p>
      </div>
    </section>
  );
}
