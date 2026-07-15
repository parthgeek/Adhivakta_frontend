"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function MetricCard({ title, value, hint, icon: Icon, href, loading, tone }) {
  const body = (
    <Card className={cn("transition-colors", href && "hover:border-primary/40 hover:bg-muted/40 cursor-pointer")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          {Icon ? <Icon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden /> : null}
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-20" />
        ) : (
          <p className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "red" && "text-red-600", tone === "amber" && "text-amber-600")}>
            {value}
          </p>
        )}
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
  return href ? <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">{body}</Link> : body
}
