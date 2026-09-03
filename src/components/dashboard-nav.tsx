"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MODULES } from "@/lib/modules";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navegación del dashboard:
 * - En mobile: barra inferior fija, alcanzable con el pulgar (targets ≥44px).
 * - En pantallas grandes (lg+): barra lateral fija.
 */
export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Lateral — solo desktop */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white lg:dark:border-slate-800 lg:dark:bg-slate-950">
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">
            PPS
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Gestión de PPS
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {MODULES.map((m) => {
            const active = isActive(pathname, m.href);
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                {m.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Inferior — solo mobile/tablet */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-slate-800 dark:bg-slate-950/95"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
          {MODULES.map((m) => {
            const active = isActive(pathname, m.href);
            const Icon = m.icon;
            return (
              <li key={m.href} className="flex-1">
                <Link
                  href={m.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-medium leading-none transition-colors ${
                    active
                      ? "text-slate-900 dark:text-slate-100"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span>{m.short}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
