import { getModuleByHref } from "@/lib/modules";

/**
 * Placeholder para un módulo todavía no implementado: nombre, descripción y un
 * aviso de "todavía no disponible".
 */
export function ModulePlaceholder({ href }: { href: string }) {
  const mod = getModuleByHref(href);
  if (!mod) return null;
  const Icon = mod.icon;

  return (
    <section className="mx-auto max-w-xl">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-fg">
          <Icon className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">{mod.label}</h1>
      </header>

      <p className="mt-4 text-sm leading-relaxed text-muted">{mod.description}</p>

      <div className="mt-6 rounded-xl border border-dashed border-line-strong bg-surface p-4 text-sm">
        <p className="font-medium">Todavía no está disponible</p>
        <p className="mt-1 text-muted">
          Este módulo se agrega más adelante. Los que ya podés usar están en la
          navegación.
        </p>
      </div>
    </section>
  );
}
