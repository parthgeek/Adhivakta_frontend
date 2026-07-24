"use client"

// Server-side data table: renders columns over rows from useServerTable,
// with sort headers, pagination, loading skeletons, empty and error states.

import { Fragment, useMemo } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/admin/shared/empty-state"
import { formatNumber } from "@/lib/admin/format"
import { cn } from "@/lib/utils"

export function DataTable({
  columns,
  table, // return value of useServerTable
  onRowClick,
  emptyTitle = "Nothing here",
  emptyDescription,
  groupBy,
}) {
  const { data, pagination, loading, error, filters, setParams, setPage, refresh } = table

  const currentSort = filters.sort || ""
  const toggleSort = (field) => {
    if (currentSort === field) setParams({ sort: `-${field}` })
    else if (currentSort === `-${field}`) setParams({ sort: undefined })
    else setParams({ sort: field })
  }

  const groupedRows = useMemo(() => {
    if (!groupBy?.active || data.length === 0) return null
    const groups = []
    const byKey = new Map()
    data.forEach((row) => {
      const key = groupBy.getKey(row) || "__unknown"
      if (!byKey.has(key)) {
        const group = {
          key,
          label: groupBy.getLabel?.(row) || "Unknown user",
          rows: [],
        }
        byKey.set(key, group)
        groups.push(group)
      }
      byKey.get(key).rows.push(row)
    })
    return groups
  }, [data, groupBy])

  const renderRow = (row) => (
    <TableRow
      key={row._id || row.key || row.id}
      className={cn(onRowClick && "cursor-pointer")}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
    >
      {columns.map((col) => (
        <TableCell key={col.key} className={cn("whitespace-nowrap", col.cellClassName)}>
          {col.render ? col.render(row) : row[col.key] ?? "—"}
        </TableCell>
      ))}
    </TableRow>
  )

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={cn("whitespace-nowrap", col.className)}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {col.label}
                      {currentSort === col.key ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : currentSort === `-${col.key}` ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState
                    variant={error.status === 403 ? "denied" : "error"}
                    title={error.status === 403 ? "Permission denied" : "Failed to load data"}
                    description={error.message}
                    actionLabel={error.status === 403 ? undefined : "Retry"}
                    onAction={refresh}
                  />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : groupedRows ? (
              groupedRows.map((group) => (
                <Fragment key={group.key}>
                  <TableRow key={`${group.key}-group`} className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={columns.length} className="py-2 text-xs font-medium text-muted-foreground">
                      {group.label} · {formatNumber(group.rows.length)} on this page
                    </TableCell>
                  </TableRow>
                  {group.rows.map(renderRow)}
                </Fragment>
              ))
            ) : (
              data.map(renderRow)
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && !error && pagination.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {formatNumber(pagination.total)} results · page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage(pagination.page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage(pagination.page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
