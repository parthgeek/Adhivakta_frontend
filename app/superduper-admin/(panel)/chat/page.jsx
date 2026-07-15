"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { MessagesSquare, Link2Off, Archive, Activity } from "lucide-react"
import { PageHeader } from "@/components/admin/shared/page-header"
import { FilterBar } from "@/components/admin/shared/filter-bar"
import { DataTable } from "@/components/admin/shared/data-table"
import { StatusBadge } from "@/components/admin/shared/status-badge"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { MetricCard } from "@/components/admin/shared/metric-card"
import { ConfirmActionDialog } from "@/components/admin/shared/confirm-action-dialog"
import { DetailDrawer, DetailRow } from "@/components/admin/shared/detail-drawer"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useServerTable } from "@/hooks/use-admin-table"
import { api } from "@/lib/admin/api"
import { useAuth } from "@/lib/admin/auth-context"
import { formatDateTime, formatNumber, formatRelative, titleCase } from "@/lib/admin/format"

function ChatContent() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission("chat.manage")
  const table = useServerTable({ endpoint: "/admin/chat/groups" })
  const [stats, setStats] = useState(null)
  const [detail, setDetail] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)

  useEffect(() => {
    api.get("/admin/chat/stats").then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const openDetail = async (group) => {
    try {
      const { data } = await api.get(`/admin/chat/groups/${group._id}`)
      setDetail(data)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const columns = [
    { key: "name", label: "Group", render: (g) => (
      <div className="max-w-[240px]">
        <p className="truncate font-medium">{g.name}</p>
        <p className="text-xs text-muted-foreground">{g.memberCount} members</p>
      </div>
    )},
    { key: "case", label: "Linked case", render: (g) => g.case ? (
      <Link href={`/superduper-admin/cases/${g.case._id}`} onClick={(e) => e.stopPropagation()} className="text-primary hover:underline max-w-[200px] truncate block">
        {g.case.title}
      </Link>
    ) : <StatusBadge status="orphaned" tone="amber" /> },
    { key: "lastMessageAt", label: "Last activity", render: (g) => formatRelative(g.lastMessageAt) },
    { key: "flags", label: "Flags", render: (g) => (
      <div className="flex gap-1">
        {g.adminArchived ? <StatusBadge status="archived" tone="neutral" /> : null}
        {g.flags?.stale ? <StatusBadge status="stale" tone="amber" /> : null}
        {g.flags?.oversized ? <StatusBadge status="oversized" tone="amber" /> : null}
      </div>
    )},
    { key: "createdBy", label: "Owner", render: (g) => g.createdBy?.email || "—" },
    ...(canManage
      ? [{
          key: "_actions", label: "",
          render: (g) => (
            <Button size="sm" variant="outline" className="h-7" onClick={(e) => { e.stopPropagation(); setArchiveTarget(g) }}>
              {g.adminArchived ? "Restore" : "Archive"}
            </Button>
          ),
        }]
      : []),
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Chat Oversight" description="Group health and membership — message content is never shown" />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Chat metrics">
        <MetricCard title="Total groups" value={formatNumber(stats?.total)} icon={MessagesSquare} loading={!stats} />
        <MetricCard title="Orphaned (no case)" value={formatNumber(stats?.orphaned)} icon={Link2Off} loading={!stats} href="/superduper-admin/chat?orphaned=true" tone={stats?.orphaned > 0 ? "amber" : undefined} />
        <MetricCard title="Stale (60d+ quiet)" value={formatNumber(stats?.stale)} icon={Activity} loading={!stats} />
        <MetricCard title="Archived by admins" value={formatNumber(stats?.archived)} icon={Archive} loading={!stats} href="/superduper-admin/chat?archived=true" />
      </section>

      <FilterBar
        table={table}
        searchPlaceholder="Search group name…"
        selects={[
          { key: "orphaned", label: "Case link", options: [{ value: "true", label: "Orphaned only" }] },
          { key: "archived", label: "Archive", options: [{ value: "true", label: "Archived" }, { value: "false", label: "Not archived" }] },
        ]}
      />

      <DataTable columns={columns} table={table} onRowClick={openDetail} emptyTitle="No chat groups match these filters" />

      <p className="text-xs text-muted-foreground">
        Message bodies are private by default. An exceptional content-access workflow (legal hold) would require a
        dedicated permission, stated reason and security audit record — it is intentionally not exposed in this portal.
      </p>

      <DetailDrawer
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        title={detail?.name}
        description="Members and metadata only"
      >
        {detail ? (
          <>
            <div>
              <DetailRow label="Linked case">{detail.caseRef?.title || "None (orphaned)"}</DetailRow>
              <DetailRow label="Owner">{detail.createdBy?.email}</DetailRow>
              <DetailRow label="Messages">{formatNumber(detail.messageCount)}</DetailRow>
              <DetailRow label="Last activity">{formatDateTime(detail.lastMessageAt)}</DetailRow>
              <DetailRow label="Created">{formatDateTime(detail.createdAt)}</DetailRow>
              <DetailRow label="Admin archived">{detail.adminArchived ? "Yes" : "No"}</DetailRow>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Members ({(detail.members || []).length})</h3>
              <ul className="space-y-1.5">
                {(detail.members || []).map((member, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span>{member.user?.name || member.email || "Invited user"}</span>
                    <StatusBadge status={member.role} tone="neutral" />
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </DetailDrawer>

      {archiveTarget ? (
        <ConfirmActionDialog
          open={!!archiveTarget}
          onOpenChange={(open) => !open && setArchiveTarget(null)}
          title={archiveTarget.adminArchived ? "Restore group" : "Archive group"}
          description={`"${archiveTarget.name}" will be ${archiveTarget.adminArchived ? "restored for its members" : "archived platform-wide"}.`}
          requireReason
          destructive={!archiveTarget.adminArchived}
          confirmLabel={archiveTarget.adminArchived ? "Restore" : "Archive"}
          onConfirm={async (reason) => {
            await api.patch(`/admin/chat/groups/${archiveTarget._id}/archive`, { archived: !archiveTarget.adminArchived, reason })
            toast.success(archiveTarget.adminArchived ? "Group restored" : "Group archived")
            table.refresh()
          }}
        />
      ) : null}
    </div>
  )
}

export default function ChatPage() {
  return (
    <PermissionGuard permission="chat.view" showDenied>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ChatContent />
      </Suspense>
    </PermissionGuard>
  )
}
