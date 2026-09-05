import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger";

const TONE: Record<Tone, string> = {
  info: "bg-surface-2 text-slate-700 dark:text-slate-200",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
};

const ICON: Record<Tone, ReactNode> = {
  info: <path d="M12 8v.5M12 11v5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />,
  success: <path d="M20 6 9 17l-5-5" />,
  warning: (
    <path d="M12 9v4M12 17v.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  ),
  danger: <path d="M12 7v6M12 16.5v.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />,
};

export function Alert({
  tone = "info",
  children,
  className,
  role = tone === "danger" ? "alert" : "status",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  role?: "alert" | "status";
}) {
  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-2 rounded-[0.625rem] px-3 py-2.5 text-[13px]",
        TONE[tone],
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-px h-4 w-4 shrink-0"
        aria-hidden
      >
        {ICON[tone]}
      </svg>
      <span>{children}</span>
    </div>
  );
}
