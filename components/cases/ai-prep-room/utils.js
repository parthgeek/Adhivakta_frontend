/** Small presentation helpers for the AI Prep Room. */

export function formatDate(iso, opts) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...opts,
    });
  } catch {
    return "—";
  }
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** "3 days ago", "in 7 days", "today". */
export function relativeFromNow(iso) {
  if (!iso) return "—";
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return "—";
  const diffDays = Math.round((target - Date.now()) / 86_400_000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 0) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

export const SEVERITY_META = {
  low: {
    label: "Low",
    badge: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 ring-emerald-500/25",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "Medium",
    badge: "bg-amber-500/12 text-amber-600 dark:text-amber-400 ring-amber-500/25",
    dot: "bg-amber-500",
  },
  high: {
    label: "High",
    badge: "bg-rose-500/12 text-rose-600 dark:text-rose-400 ring-rose-500/25",
    dot: "bg-rose-500",
  },
};

export const ASSISTANT_STATUS_META = {
  ready: { label: "AI Ready", dot: "bg-emerald-500", pulse: false },
  thinking: { label: "AI Thinking", dot: "bg-amber-500", pulse: true },
  indexing: { label: "Indexing", dot: "bg-sky-500", pulse: true },
  idle: { label: "Not indexed", dot: "bg-muted-foreground", pulse: false },
  offline: { label: "AI Offline", dot: "bg-muted-foreground", pulse: false },
};

export function scoreColor(value) {
  if (value >= 75) return "text-emerald-500";
  if (value >= 50) return "text-amber-500";
  return "text-rose-500";
}
