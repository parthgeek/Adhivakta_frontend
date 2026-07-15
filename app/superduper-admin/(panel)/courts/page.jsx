"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Landmark, RefreshCw, Database, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/admin/shared/page-header"
import { FilterBar } from "@/components/admin/shared/filter-bar"
import { DataTable } from "@/components/admin/shared/data-table"
import { StatusBadge } from "@/components/admin/shared/status-badge"
import { ExportButton } from "@/components/admin/shared/export-button"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { MetricCard } from "@/components/admin/shared/metric-card"
import { ConfirmActionDialog } from "@/components/admin/shared/confirm-action-dialog"
import { DetailDrawer, DetailRow } from "@/components/admin/shared/detail-drawer"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useServerTable } from "@/hooks/use-admin-table"
import { api } from "@/lib/admin/api"
import { useAuth } from "@/lib/admin/auth-context"
import { formatDateTime, formatNumber, formatRelative, titleCase } from "@/lib/admin/format"

function SyncRunsTab() {
  const { hasPermission } = useAuth()
  const [runs, setRuns] = useState(null)
  const [selectedRun, setSelectedRun] = useState(null)
  const [retryOpen, setRetryOpen] = useState(false)

  const load = useCallback(() => {
    api.get("/admin/courts/sync-runs?limit=25").then((res) => setRuns(res.data)).catch(() => setRuns([]))
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Judge-wise cause-list fetch runs, most recent first.</p>
        {hasPermission("courts.manage") ? (
          <Button size="sm" onClick={() => setRetryOpen(true)}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Run sync now
          </Button>
        ) : null}
      </div>

      {!runs ? (
        <Skeleton className="h-64 w-full" />
      ) : runs.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No sync runs recorded yet.</p>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Started</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Trigger</th>
                <th className="px-3 py-2 font-medium">Targets</th>
                <th className="px-3 py-2 font-medium">Lists stored</th>
                <th className="px-3 py-2 font-medium">Matched cases</th>
                <th className="px-3 py-2 font-medium">Failures</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run._id} className="border-b last:border-0 cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRun(run)}>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(run.startedAt)}</td>
                  <td className="px-3 py-2"><StatusBadge status={run.status} /></td>
                  <td className="px-3 py-2">{titleCase(run.trigger)}</td>
                  <td className="px-3 py-2 tabular-nums">{run.targetsFetched}/{run.targetsDiscovered}</td>
                  <td className="px-3 py-2 tabular-nums">{formatNumber(run.causeListsStored)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatNumber(run.matchedCases)}</td>
                  <td className="px-3 py-2 tabular-nums">{(run.failures || []).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DetailDrawer
        open={!!selectedRun}
        onOpenChange={(open) => !open && setSelectedRun(null)}
        title={`Sync run — ${selectedRun ? formatDateTime(selectedRun.startedAt) : ""}`}
        description="Job log and error summary (provider secrets are redacted)"
      >
        {selectedRun ? (
          <>
            <div>
              <DetailRow label="Status"><StatusBadge status={selectedRun.status} /></DetailRow>
              <DetailRow label="Business date">{selectedRun.businessDate}</DetailRow>
              <DetailRow label="Trigger">{titleCase(selectedRun.trigger)}</DetailRow>
              <DetailRow label="Completed">{formatDateTime(selectedRun.completedAt)}</DetailRow>
              <DetailRow label="Events created">{formatNumber(selectedRun.eventsCreated)}</DetailRow>
              {selectedRun.notes ? <DetailRow label="Notes">{selectedRun.notes}</DetailRow> : null}
            </div>
            {(selectedRun.failures || []).length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-medium">Failures ({selectedRun.failures.length})</h3>
                <ul className="space-y-2">
                  {selectedRun.failures.map((failure, i) => (
                    <li key={i} className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs dark:border-red-900 dark:bg-red-950">
                      <p className="font-medium">{failure.targetLabel || failure.providerKey || "Unknown target"}</p>
                      <p className="mt-0.5 text-muted-foreground break-words">{failure.error}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </DetailDrawer>

      <ConfirmActionDialog
        open={retryOpen}
        onOpenChange={setRetryOpen}
        title="Trigger cause-list sync"
        description="Starts a full judge-wise cause-list fetch for today. This can take several minutes and hits external court portals."
        requireReason
        confirmLabel="Start sync"
        onConfirm={async (reason) => {
          await api.post("/admin/courts/sync-runs/retry", { reason })
          toast.success("Sync started")
          setTimeout(load, 1500)
        }}
      />
    </div>
  )
}

function CourtsContent() {
  const initialTab = useSearchParams().get("tab")
  const table = useServerTable({ endpoint: "/admin/courts", pageSize: 50 })
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get("/admin/courts/stats").then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const freshest = (stats?.freshness || []).reduce((latest, f) => {
    const t = f.lastImportedAt ? new Date(f.lastImportedAt) : null
    return t && (!latest || t > latest) ? t : latest
  }, null)

  const columns = [
    { key: "name", label: "Court", render: (c) => (
      <div className="max-w-[300px]">
        <p className="truncate font-medium">{c.name || c.court || c.complex}</p>
        <p className="text-xs text-muted-foreground font-mono">{c.code}</p>
      </div>
    )},
    { key: "source", label: "Source", render: (c) => <StatusBadge status={c.source} tone="navy" /> },
    { key: "state", label: "State", render: (c) => titleCase(c.state || "") },
    { key: "district", label: "District", render: (c) => titleCase(c.district || "") },
    { key: "highCourt", label: "High Court / Bench", render: (c) => [c.highCourt, c.bench].filter(Boolean).join(" · ") || "—" },
    { key: "importedAt", label: "Imported", render: (c) => formatRelative(c.importedAt) },
  ]

  const totalCourts = (stats?.bySource || []).reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="space-y-4">
      <PageHeader title="Cause Lists & Courts" description="Court directory, cause-list synchronisation and data freshness">
        <ExportButton endpoint="/admin/courts/export" filename="courts-export.csv" filters={table.filters} permission="courts.view" />
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Court metrics">
        <MetricCard title="Courts in directory" value={formatNumber(totalCourts)} icon={Landmark} loading={!stats} />
        <MetricCard title="eCourts entries" value={formatNumber(stats?.bySource?.find((s) => s._id === "ecourts")?.count || 0)} icon={Database} loading={!stats} />
        <MetricCard title="High Court entries" value={formatNumber(stats?.bySource?.find((s) => s._id === "highcourts")?.count || 0)} icon={Database} loading={!stats} />
        <MetricCard title="Directory freshness" value={freshest ? formatRelative(freshest) : "—"} icon={AlertTriangle} loading={!stats} hint="Latest import across sources" />
      </section>

      <Tabs defaultValue={initialTab === "sync" ? "sync" : "directory"}>
        <TabsList>
          <TabsTrigger value="directory">Court directory</TabsTrigger>
          <TabsTrigger value="sync">Cause-list sync</TabsTrigger>
        </TabsList>
        <TabsContent value="directory" className="space-y-4 pt-2">
          <FilterBar
            table={table}
            searchPlaceholder="Search court, complex or code…"
            selects={[
              { key: "source", label: "Source", options: ["ecourts", "highcourts", "supremecourt"] },
            ]}
          />
          <DataTable columns={columns} table={table} emptyTitle="No courts match these filters" />
        </TabsContent>
        <TabsContent value="sync" className="pt-2">
          <SyncRunsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function CourtsPage() {
  return (
    <PermissionGuard permission="courts.view" showDenied>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CourtsContent />
      </Suspense>
    </PermissionGuard>
  )
}
