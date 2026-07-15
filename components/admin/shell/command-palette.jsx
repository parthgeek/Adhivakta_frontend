"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { NAV_ITEMS } from "@/lib/admin/navigation"
import { useAuth } from "@/lib/admin/auth-context"

// Global ⌘K / Ctrl+K palette for navigation and quick record search
export function CommandPalette({ open, onOpenChange }) {
  const router = useRouter()
  const { hasPermission } = useAuth()
  const [query, setQuery] = useState("")

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  const go = (href) => {
    onOpenChange(false)
    setQuery("")
    router.push(href)
  }

  const items = NAV_ITEMS.filter((item) => hasPermission(item.permission))

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Go to page or search records…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {items.map((item) => (
            <CommandItem key={item.href} onSelect={() => go(item.href)}>
              <item.icon className="mr-2 h-4 w-4" aria-hidden />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {query.trim().length > 1 ? (
          <CommandGroup heading="Search records">
            {hasPermission("users.view") ? (
              <CommandItem onSelect={() => go(`/superduper-admin/users?q=${encodeURIComponent(query.trim())}`)}>
                Search users for “{query.trim()}”
              </CommandItem>
            ) : null}
            {hasPermission("cases.view") ? (
              <CommandItem onSelect={() => go(`/superduper-admin/cases?q=${encodeURIComponent(query.trim())}`)}>
                Search cases for “{query.trim()}”
              </CommandItem>
            ) : null}
            {hasPermission("documents.view") ? (
              <CommandItem onSelect={() => go(`/superduper-admin/documents?q=${encodeURIComponent(query.trim())}`)}>
                Search documents for “{query.trim()}”
              </CommandItem>
            ) : null}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  )
}
