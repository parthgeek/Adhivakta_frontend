"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

export function DetailDrawer({ open, onOpenChange, title, description, children }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-4">
            <SheetHeader className="text-left">
              <SheetTitle>{title}</SheetTitle>
              {description ? <SheetDescription>{description}</SheetDescription> : null}
            </SheetHeader>
            {children}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 text-sm border-b border-border/60 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{children ?? "—"}</span>
    </div>
  )
}
