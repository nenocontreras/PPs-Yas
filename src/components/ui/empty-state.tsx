import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-line-strong bg-surface p-6 text-center",
        className,
      )}
    >
      {icon && (
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-slate-700 dark:text-slate-200 [&>svg]:h-5.5 [&>svg]:w-5.5">
          {icon}
        </span>
      )}
      <p className={cn("text-sm font-semibold", icon && "mt-3.5")}>{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
