"use client"

import { StatusBadge } from "@/components/admin/shared/status-badge"
import { formatDateTime, titleCase } from "@/lib/admin/format"

// Renders audit events (or shaped activity entries) as a vertical timeline
export function ActivityTimeline({ events = [], emptyLabel = "No activity recorded" }) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{emptyLabel}</p>
  }
  return (
    <ol className="space-y-0">
      {events.map((event) => (
        <li key={event._id} className="relative pl-5 pb-4 border-l border-border last:pb-0">
          <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary/60" aria-hidden />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{titleCase(event.action || "event")}</span>
            <StatusBadge status={event.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {event.actorEmail || "system"} · {formatDateTime(event.createdAt)}
            {event.targetLabel ? <> · {event.targetLabel}</> : null}
          </p>
          {event.reason ? <p className="text-xs mt-1 italic text-muted-foreground">“{event.reason}”</p> : null}
        </li>
      ))}
    </ol>
  )
}
