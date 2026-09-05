import type { ReactNode } from "react";

import { Alert } from "./alert";

/**
 * Layout de las pantallas de autenticación: pantalla centrada, card de ancho
 * máx 400px, marca arriba, banner de error opcional sobre el contenido.
 */
export function AuthCard({
  title,
  subtitle,
  error,
  children,
  footer,
  legal,
}: {
  title: string;
  subtitle?: string;
  error?: string | null;
  children: ReactNode;
  footer?: ReactNode;
  legal?: ReactNode;
}) {
  return (
    <div className="w-full max-w-[400px]">
      <div className="rounded-[0.875rem] border border-line bg-surface p-6 shadow-[0_4px_16px_-6px_rgb(15_23_42/0.12)] sm:p-7">
        <div className="mb-6 flex flex-col items-center gap-2.5 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-fg">
            PPS
          </span>
          <h1 className="text-lg font-semibold">{title}</h1>
          {subtitle && <p className="text-[13px] text-muted">{subtitle}</p>}
        </div>

        {error && (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        )}

        {children}

        {footer && (
          <p className="mt-[18px] text-center text-[13px] text-muted">{footer}</p>
        )}
        {legal && (
          <p className="mt-3.5 text-center text-[11px] text-muted">{legal}</p>
        )}
      </div>
    </div>
  );
}
