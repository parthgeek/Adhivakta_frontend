"use client"

import { Inbox, ShieldAlert, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

const ICONS = { empty: Inbox, error: TriangleAlert, denied: ShieldAlert }

export function EmptyState({ variant = "empty", title, description, actionLabel, onAction }) {
  const Icon = ICONS[variant] || Inbox
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 px-4 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {actionLabel ? (
        <Button variant="outline" size="sm" className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
