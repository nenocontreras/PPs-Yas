"use client";

import { useId } from "react";
import type {
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

const CONTROL =
  "w-full min-h-11 rounded-[0.625rem] border border-line-strong bg-surface px-3 text-ink " +
  "transition-colors placeholder:text-line-strong hover:border-muted " +
  "focus:border-focus focus:outline-none focus:ring-3 focus:ring-focus/25 " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted";

function Wrapper({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
        {optional && <span className="font-normal text-muted"> (opcional)</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  error,
  optional,
  className,
  rows = 3,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, "min-h-20 resize-y py-2 leading-relaxed", className)}
        {...props}
      />
    </Wrapper>
  );
}

export function Select({
  label,
  hint,
  error,
  optional,
  className,
  children,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} optional={optional}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, "appearance-none bg-no-repeat pr-8", className)}
        {...props}
      >
        {children}
      </select>
    </Wrapper>
  );
}
