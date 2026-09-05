"use client";

import { useTransition } from "react";

import { logout } from "@/app/(dashboard)/actions";
import { cn } from "@/lib/cn";

/**
 * Cierra la sesión. Antes de llamar a la acción del servidor limpia el cache
 * `supabase` del service worker, para que no queden respuestas con datos del
 * usuario anterior en el dispositivo (ver pwa-auditor / confidentiality-guard).
 */
export function LogoutButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    try {
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => k.startsWith("supabase"))
            .map((k) => caches.delete(k)),
        );
      }
    } catch {
      // el cache no es crítico para el logout
    }
    startTransition(() => {
      void logout();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-danger transition-colors hover:bg-danger-bg disabled:opacity-50",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
      {pending ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
}
