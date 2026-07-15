"use client"

import { cn } from "@/lib/utils"
import { titleCase } from "@/lib/admin/format"

// Semantic colors only: green = healthy, amber = attention, red = problem,
// neutral for everything else.
const TONE_CLASSES = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
  neutral: "bg-muted text-muted-foreground border-border",
  navy: "bg-primary/10 text-primary border-primary/20",
}

const STATUS_TONES = {
  // users
  active: "green", suspended: "red", deactivated: "neutral",
  // cases
  pending: "amber", closed: "neutral", disposed: "neutral",
  // documents
  approved: "green", rejected: "red",
  // hearings
  scheduled: "navy", confirmed: "green", cancelled: "neutral", completed: "green", adjourned: "amber",
  // sync runs
  running: "navy", completed_with_errors: "amber", failed: "red",
  // subscriptions
  trialing: "navy", past_due: "amber", expired: "neutral",
  // payments / audit
  succeeded: "green", success: "green", failure: "red", denied: "red", refunded: "neutral",
  // priority
  low: "neutral", normal: "neutral", medium: "neutral", high: "amber", urgent: "red", critical: "red",
  // misc
  operational: "green", degraded: "amber", info: "navy", warning: "amber",
}

export function StatusBadge({ status, tone, className }) {
  if (status === null || status === undefined || status === "") return <span className="text-muted-foreground">—</span>
  const resolved = tone || STATUS_TONES[String(status).toLowerCase()] || "neutral"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[resolved],
        className
      )}
    >
      {titleCase(String(status))}
    </span>
  )
}
