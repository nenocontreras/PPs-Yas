import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin conexión",
};

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <span className="grid mx-auto h-12 w-12 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">
          PPS
        </span>
        <h1 className="mt-4 text-lg font-semibold">Estás sin conexión</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Esta pantalla todavía no se descargó para uso offline. Volvé a
          intentar cuando tengas señal.
        </p>
      </div>
    </main>
  );
}
