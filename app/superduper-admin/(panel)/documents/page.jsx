"use client"

import { Suspense, useEffect, useState } from "react"
import { toast } from "sonner"
import { FileText, ShieldAlert, HardDrive, Clock } from "lucide-react"
import { PageHeader } from "@/components/admin/shared/page-header"
import { FilterBar } from "@/components/admin/shared/filter-bar"
import { DataTable } from "@/components/admin/shared/data-table"
import { StatusBadge } from "@/components/admin/shared/status-badge"
import { ExportButton } from "@/components/admin/shared/export-button"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { MetricCard } from "@/components/admin/shared/metric-card"
import { ConfirmActionDialog } from "@/components/admin/shared/confirm-action-dialog"
import { DetailDrawer, DetailRow } from "@/components/admin/shared/detail-drawer"
import { ActivityTimeline } from "@/components/admin/shared/activity-timeline"
import { useAdminUserFilter } from "@/components/admin/shared/user-filter"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { useServerTable } from "@/hooks/use-admin-table"
import { api } from "@/lib/admin/api"
import { useAuth } from "@/lib/admin/auth-context"
import { formatBytes, formatDateTime, formatNumber, titleCase } from "@/lib/admin/format"

const FILE_TYPES = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "jpg", "jpeg", "png", "csv", "zip"]

function DocumentsContent() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission("documents.manage")
  const table = useServerTable({ endpoint: "/admin/documents", defaultSort: "-createdAt" })
  const userFilter = useAdminUserFilter({ key: "uploader", label: "User" })
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState([])
  const [detail, setDetail] = useState(null)
  const [dialog, setDialog] = useState(null) // { type: approve|reject|bulk, doc? }

  useEffect(() => {
    api.get("/admin/documents/stats").then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const toggleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const openDetail = async (doc) => {
    try {
      const { data } = await api.get(`/admin/documents/${doc._id}`)
      setDetail(data)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const columns = [
    ...(canManage
      ? [{
          key: "_select",
          label: "",
          render: (d) =>
            d.approvalStatus === "pending" ? (
              <Checkbox
                checked={selected.includes(d._id)}
                onCheckedChange={() => toggleSelect(d._id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${d.name}`}
              />
            ) : null,
        }]
      : []),
    { key: "name", label: "Document", sortable: true, render: (d) => (
      <div className="max-w-[260px]">
        <p className="truncate font-medium">{d.name}</p>
        <p className="text-xs text-muted-foreground uppercase">{d.type} · {formatBytes(d.size)}</p>
      </div>
    )},
    { key: "approvalStatus", label: "Approval", sortable: true, render: (d) => <StatusBadge status={d.approvalStatus} /> },
    { key: "caseTitle", label: "Case", render: (d) => <span className="max-w-[200px] truncate block">{d.caseTitle}</span> },
    { key: "uploadedByName", label: "Uploader" },
    { key: "createdAt", label: "Uploaded", sortable: true, render: (d) => formatDateTime(d.createdAt) },
    ...(canManage
      ? [{
          key: "_actions",
          label: "",
          render: (d) =>
            d.approvalStatus === "pending" ? (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="outline" className="h-7 text-emerald-700" onClick={() => setDialog({ type: "approve", doc: d })}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-destructive" onClick={() => setDialog({ type: "reject", doc: d })}>
                  Reject
                </Button>
              </div>
            ) : null,
        }]
      : []),
  ]

  const dialogProps = dialog && {
    approve: {
      title: "Approve document",
      description: `"${dialog.doc?.name}" will become available to its case members.`,
      confirmLabel: "Approve",
      onConfirm: async (reason) => {
        await api.patch(`/admin/documents/${dialog.doc._id}/approve`, { notes: reason })
        toast.success("Document approved")
        table.refresh()
      },
    },
    reject: {
      title: "Reject document",
      description: `"${dialog.doc?.name}" will be rejected. The uploader can see your reason.`,
      destructive: true, requireReason: true, confirmLabel: "Reject",
      onConfirm: async (reason) => {
        await api.patch(`/admin/documents/${dialog.doc._id}/reject`, { reason })
        toast.success("Document rejected")
        table.refresh()
      },
    },
    bulk: {
      title: `Approve ${selected.length} documents`,
      description: "Bulk approval applies only to documents currently pending review.",
      impact: "Only use bulk approval for documents you have verified as safe.",
      confirmLabel: "Approve all selected",
      onConfirm: async (reason) => {
        const { data } = await api.post("/admin/documents/bulk-approve", { ids: selected, reason })
        toast.success(`${data.approved} documents approved`)
        setSelected([])
        table.refresh()
      },
    },
  }[dialog.type]

  return (
    <div className="space-y-4">
      <PageHeader title="Documents" description="Approval queue, storage operations and access auditing">
        <ExportButton endpoint="/admin/documents/export" filename="documents-export.csv" filters={table.filters} permission="documents.view" />
        {canManage && selected.length > 0 ? (
          <Button size="sm" onClick={() => setDialog({ type: "bulk" })}>Approve selected ({selected.length})</Button>
        ) : null}
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Document metrics">
        <MetricCard title="Pending approval" value={formatNumber(stats?.pendingApproval)} icon={Clock} loading={!stats} href="/superduper-admin/documents?approvalStatus=pending" tone={stats?.pendingApproval > 0 ? "amber" : undefined} />
        <MetricCard title="Total files" value={formatNumber(stats?.totals?.count)} icon={FileText} loading={!stats} />
        <MetricCard title="Storage used" value={formatBytes(stats?.totals?.totalBytes)} icon={HardDrive} loading={!stats} />
        <MetricCard title="Large uploads (>25MB)" value={formatNumber(stats?.largeUploads?.length)} icon={ShieldAlert} loading={!stats} tone={stats?.largeUploads?.length > 0 ? "amber" : undefined} />
      </section>

      <FilterBar
        table={table}
        searchPlaceholder="Search name, case or uploader…"
        dateRange
        selects={[
          { key: "approvalStatus", label: "Approval", options: ["pending", "approved", "rejected"] },
          { key: "type", label: "Type", options: FILE_TYPES.map((t) => ({ value: t, label: t.toUpperCase() })) },
          { key: "status", label: "Status", options: ["active", "draft", "archived"] },
          userFilter.select,
        ]}
      />

      <DataTable
        columns={columns}
        table={table}
        onRowClick={openDetail}
        emptyTitle="No documents match these filters"
        groupBy={{
          active: Boolean(table.filters.uploader),
          getKey: () => table.filters.uploader,
          getLabel: () => userFilter.labelForUser(table.filters.uploader),
        }}
      />

      <p className="text-xs text-muted-foreground">
        Uploads are scanned with ClamAV at upload time and rejected if infected; persistent quarantine and checksum
        tracking require backend storage of scan results, which is not available yet.
      </p>

      <DetailDrawer
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        title={detail?.name}
        description="File metadata and access log — raw file URLs are never exposed here"
      >
        {detail ? (
          <>
            <div>
              <DetailRow label="Original name">{detail.originalName}</DetailRow>
              <DetailRow label="Type">{detail.type?.toUpperCase()} ({detail.mimeType})</DetailRow>
              <DetailRow label="Size">{formatBytes(detail.size)}</DetailRow>
              <DetailRow label="Version">{detail.version}</DetailRow>
              <DetailRow label="Storage">{titleCase(detail.storageProvider || "local")}</DetailRow>
              <DetailRow label="Confidential">{detail.isConfidential ? "Yes" : "No"}</DetailRow>
              <DetailRow label="Case">{detail.caseTitle}</DetailRow>
              <DetailRow label="Uploaded by">{detail.uploadedBy?.email || detail.uploadedByName}</DetailRow>
              <DetailRow label="Uploaded at">{formatDateTime(detail.createdAt)}</DetailRow>
              <DetailRow label="Approval"><StatusBadge status={detail.approvalStatus} /></DetailRow>
              {detail.reviewedBy ? <DetailRow label="Reviewed by">{detail.reviewedBy.email}</DetailRow> : null}
              {detail.reviewNotes ? <DetailRow label="Review notes">{detail.reviewNotes}</DetailRow> : null}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Admin access log</h3>
              <ActivityTimeline events={detail.accessLog} emptyLabel="No admin actions on this document yet" />
            </div>
          </>
        ) : null}
      </DetailDrawer>

      {dialog ? (
        <ConfirmActionDialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)} {...dialogProps} />
      ) : null}
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <PermissionGuard permission="documents.view" showDenied>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <DocumentsContent />
      </Suspense>
    </PermissionGuard>
  )
}
