import React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  id,
  className = "",
  disabled,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-ink"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        disabled={disabled}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-help` : undefined}
        className={`w-full px-3.5 py-2 text-sm bg-surface rounded-lg border text-ink placeholder:text-text-muted/60 transition-colors motion-transition-micro focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:bg-surface-muted resize-y ${
          error
            ? "border-danger focus:border-danger focus:ring-danger"
            : "border-border-strong focus:border-ink focus:ring-ink"
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="text-xs text-danger font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${textareaId}-help`} className="text-xs text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}
