"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { MoreIcon } from "@/components/icons";
import { LogoutButton } from "@/components/logout-button";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/cn";

/** Módulos en la barra inferior de mobile; el resto va al menú "Más". */
const MOBILE_PRIMARY = ["/", "/bitacora", "/tareas", "/evidencia"];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const primary = MODULES.filter((m) => MOBILE_PRIMARY.includes(m.href));
  const overflow = MODULES.filter((m) => !MOBILE_PRIMARY.includes(m.href));
  const moreActive = overflow.some((m) => isActive(pathname, m.href));

  return (
    <>
      {/* Lateral — solo desktop */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-line lg:bg-surface">
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
            PPS
          </span>
          <span className="text-sm font-semibold">Gestión de PPS</span>
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
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-fg"
                    : "text-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icon className="h-5 w-5" />
                {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-1 border-t border-line p-3">
          {userEmail && (
            <p className="truncate px-3 py-1 text-xs text-muted" title={userEmail}>
              {userEmail}
            </p>
          )}
          <LogoutButton />
        </div>
      </aside>

      {/* Menú "Más" — mobile, se abre desde la barra inferior */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-slate-900/35"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-surface p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_-4px_rgb(15_23_42/0.15)]">
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line" />
            {overflow.map((m) => {
              const active = isActive(pathname, m.href);
              const Icon = m.icon;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={closeMenu}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3.5 rounded-lg px-3.5 text-sm font-medium",
                    active ? "font-semibold text-ink" : "text-ink",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {m.label}
                </Link>
              );
            })}
            <div className="mx-3.5 my-1.5 border-t border-line" />
            <LogoutButton />
          </div>
        </div>
      )}

      {/* Inferior — solo mobile/tablet */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
          {primary.map((m) => {
            const active = isActive(pathname, m.href);
            const Icon = m.icon;
            return (
              <li key={m.href} className="flex-1">
                <Link
                  href={m.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-medium leading-none transition-colors",
                    active ? "text-ink" : "text-muted",
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span>{m.short}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className={cn(
                "flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-medium leading-none transition-colors",
                menuOpen || moreActive ? "text-ink" : "text-muted",
              )}
            >
              <MoreIcon className="h-6 w-6" />
              <span>Más</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
