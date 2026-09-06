"use client";

import { useId } from "react";
import type {
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

const CONTROL =
  "w-full min-h-11 rounded-[0.625rem] border bg-surface px-3 text-ink " +
  "transition-colors placeholder:text-muted hover:border-muted " +
  "focus:border-focus focus:outline-none focus:ring-3 focus:ring-focus/50 " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted";

const borderCls = (error?: string) =>
  error
    ? "border-danger focus:border-danger focus:ring-danger/50"
    : "border-line-strong";

type CommonProps = {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

function Frame({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: CommonProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
        {optional && <span className="font-normal text-muted"> (opcional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
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

export function Textarea({
  label,
  hint,
  error,
  optional,
  className,
  rows = 3,
  ...props
}: CommonProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">) {
  const id = useId();
  return (
    <Frame id={id} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(
          CONTROL,
          borderCls(error),
          "min-h-20 resize-y py-2 leading-relaxed",
          className,
        )}
        {...props}
      />
    </Frame>
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
}: CommonProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">) {
  const id = useId();
  return (
    <Frame id={id} label={label} hint={hint} error={error} optional={optional}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(
          CONTROL,
          borderCls(error),
          "appearance-none bg-no-repeat pr-8",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </Frame>
  );
}
