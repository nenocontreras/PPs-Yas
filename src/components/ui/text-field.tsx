"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: string;
  error?: string;
  /** Ícono a la izquierda del input. */
  icon?: ReactNode;
  /** Agrega "(opcional)" al label. */
  optional?: boolean;
  /** Contenido alineado a la derecha en la fila del label (ej. link "¿La olvidaste?"). */
  labelRight?: ReactNode;
}

export function TextField({
  label,
  hint,
  error,
  icon,
  optional = false,
  labelRight,
  className,
  type = "text",
  ...props
}: TextFieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  const isPassword = type === "password";
  const [reveal, setReveal] = useState(false);
  const inputType = isPassword && reveal ? "text" : type;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium">
          {label}
          {optional && (
            <span className="font-normal text-muted"> (opcional)</span>
          )}
        </label>
        {labelRight}
      </div>

      <div className="relative flex items-center">
        {icon && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 grid h-[18px] w-[18px] place-items-center text-muted [&>svg]:h-full [&>svg]:w-full"
          >
            {icon}
          </span>
        )}
        <input
          id={id}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full min-h-11 rounded-[0.625rem] border bg-surface px-3 text-ink",
            "transition-colors placeholder:text-muted",
            "hover:border-muted focus:outline-none focus-visible:outline-none",
            "focus:border-focus focus:ring-3 focus:ring-focus/50",
            "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted",
            Boolean(icon) && "pl-[38px]",
            isPassword && "pr-16",
            error
              ? "border-danger focus:border-danger focus:ring-danger/50"
              : "border-line-strong",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-pressed={reveal}
            aria-label={reveal ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-1 grid min-h-11 min-w-11 place-items-center rounded-md px-2 text-xs text-muted hover:text-ink"
          >
            {reveal ? "Ocultar" : "Ver"}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs text-danger">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="h-3.5 w-3.5 shrink-0"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6M12 16.5v.5" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
