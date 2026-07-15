"use client"

// Toolbar of search box + select filters + date range, wired to useServerTable.

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { titleCase } from "@/lib/admin/format"

export function FilterBar({ table, searchPlaceholder = "Search…", selects = [], dateRange = false, children }) {
  const { filters, setParams, searchInput, onSearchChange } = table

  const activeFilterKeys = [...selects.map((s) => s.key), ...(dateRange ? ["from", "to"] : []), "q"].filter(
    (key) => filters[key]
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-8"
          aria-label="Search"
        />
      </div>

      {selects.map((select) => (
        <Select
          key={select.key}
          value={filters[select.key] || "all"}
          onValueChange={(value) => setParams({ [select.key]: value })}
        >
          <SelectTrigger className="w-auto min-w-[130px]" aria-label={select.label}>
            <SelectValue placeholder={select.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{select.label}: All</SelectItem>
            {select.options.map((opt) => {
              const value = typeof opt === "string" ? opt : opt.value
              const label = typeof opt === "string" ? titleCase(opt) : opt.label
              return (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      ))}

      {dateRange ? (
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={filters.from || ""}
            onChange={(e) => setParams({ from: e.target.value })}
            className="w-[150px]"
            aria-label="From date"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={filters.to || ""}
            onChange={(e) => setParams({ to: e.target.value })}
            className="w-[150px]"
            aria-label="To date"
          />
        </div>
      ) : null}

      {children}

      {activeFilterKeys.length > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const cleared = Object.fromEntries(activeFilterKeys.map((key) => [key, undefined]))
            onSearchChange("")
            setParams(cleared)
          }}
        >
          <X className="mr-1 h-3 w-3" /> Clear
        </Button>
      ) : null}
    </div>
  )
}
