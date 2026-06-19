"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ASSISTANT_STATUS_META, SEVERITY_META } from "./utils";

/* ------------------------------------------------------------------ */
/* Section shell — consistent heading + spacing for every section.     */
/* ------------------------------------------------------------------ */

export function SectionShell({ icon: Icon, title, description, action, children, id }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Icon className="h-[18px] w-[18px]" />
            </span>
          )}
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Assistant status badge.                                             */
/* ------------------------------------------------------------------ */

export function AssistantStatusBadge({ status = "ready", className }) {
  const meta = ASSISTANT_STATUS_META[status] ?? ASSISTANT_STATUS_META.ready;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground/80 backdrop-blur",
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        {meta.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              meta.dot,
            )}
          />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", meta.dot)} />
      </span>
      {meta.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Severity badge.                                                     */
/* ------------------------------------------------------------------ */

export function SeverityBadge({ severity = "low", className }) {
  const meta = SEVERITY_META[severity] ?? SEVERITY_META.low;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        meta.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state.                                                        */
/* ------------------------------------------------------------------ */

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/70 bg-gradient-to-b from-muted/40 to-background px-6 py-12 text-center",
        className,
      )}
    >
      {/* decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(60%_100%_at_50%_0%,hsl(var(--primary)/0.10),transparent)]"
      />
      <motion.span
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20"
      >
        {Icon && <Icon className="h-6 w-6" />}
      </motion.span>
      <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton block helper.                                              */
/* ------------------------------------------------------------------ */

export function SkeletonLine({ className }) {
  return (
    <div
      className={cn(
        "h-3.5 animate-pulse rounded-full bg-muted",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Page-level async states (shared across feature routes).             */
/* ------------------------------------------------------------------ */

export function SectionLoading({ className }) {
  return (
    <div className={cn("space-y-3 rounded-2xl border border-border/60 p-6", className)}>
      <SkeletonLine className="h-5 w-48" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-5/6" />
      <SkeletonLine className="w-2/3" />
    </div>
  );
}

export function SectionError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-14 text-center">
      <h3 className="font-heading text-base font-semibold text-foreground">
        Couldn&apos;t load this section
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      )}
    </div>
  );
}
