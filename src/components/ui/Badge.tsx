import React from "react";

export type BadgeVariant =
  | "draft"
  | "published"
  | "new"
  | "reviewing"
  | "accepted"
  | "declined"
  | "completed"
  | "open"
  | "waitlist"
  | "closed"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  draft: "bg-surface-muted text-text-muted border-border",
  published: "bg-sage-soft text-success border-sage/20",
  new: "bg-accent-soft text-accent-hover border-accent/20 font-semibold",
  reviewing: "bg-lavender-soft text-lavender border-lavender/20",
  accepted: "bg-sage-soft text-success border-sage/20",
  declined: "bg-surface-muted text-text-muted border-border",
  completed: "bg-sage-soft text-success border-sage/20",
  open: "bg-sage-soft text-success border-sage/20",
  waitlist: "bg-accent-soft text-warning border-accent/20",
  closed: "bg-surface-muted text-text-muted border-border",
  neutral: "bg-surface-muted text-ink-soft border-border",
};

export function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {children}
    </span>
  );
}
