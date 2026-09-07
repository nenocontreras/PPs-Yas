import type { Metadata } from "next";

import { LogoMark } from "@/components/brand";

export const metadata: Metadata = {
  title: "Sin conexión",
};

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <div className="flex justify-center">
          <LogoMark size={48} />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Estás sin conexión</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Esta pantalla todavía no se descargó para uso offline. Volvé a
          intentar cuando tengas señal.
        </p>
      </div>
    </main>
  );
}
